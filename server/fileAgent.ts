import { getObjectText, getObjectContent } from "./objectStorage";
import { analyzeDocument } from "./openai";
import { storage } from "./storage";

export interface ExtractedContent {
  text: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
  };
}

export async function extractTextFromFile(
  objectPath: string,
  mimeType: string
): Promise<ExtractedContent | null> {
  try {
    if (mimeType.includes("text/plain") || mimeType.includes("text/")) {
      const text = await getObjectText(objectPath);
      if (text) {
        return {
          text,
          metadata: {
            wordCount: text.split(/\s+/).filter(Boolean).length,
          },
        };
      }
    }

    if (mimeType.includes("application/json")) {
      const text = await getObjectText(objectPath);
      if (text) {
        try {
          const json = JSON.parse(text);
          const formattedText = JSON.stringify(json, null, 2);
          return {
            text: formattedText,
            metadata: {
              wordCount: formattedText.split(/\s+/).filter(Boolean).length,
            },
          };
        } catch {
          return { text };
        }
      }
    }

    if (mimeType.includes("text/csv") || objectPath.endsWith(".csv")) {
      const text = await getObjectText(objectPath);
      if (text) {
        return {
          text,
          metadata: {
            wordCount: text.split(/\s+/).filter(Boolean).length,
          },
        };
      }
    }

    if (mimeType.includes("application/pdf")) {
      const content = await getObjectContent(objectPath);
      if (content) {
        const text = extractTextFromPDF(content);
        return {
          text,
          metadata: {
            wordCount: text.split(/\s+/).filter(Boolean).length,
          },
        };
      }
    }

    if (
      mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml") ||
      mimeType.includes("application/msword")
    ) {
      const content = await getObjectContent(objectPath);
      if (content) {
        const text = extractTextFromDOCX(content);
        return {
          text,
          metadata: {
            wordCount: text.split(/\s+/).filter(Boolean).length,
          },
        };
      }
    }

    console.log(`Unsupported file type for text extraction: ${mimeType}`);
    return null;
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return null;
  }
}

function extractTextFromPDF(buffer: Buffer): string {
  try {
    const content = buffer.toString("utf8");
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map((match) => match.slice(1, -1))
      .filter((text) => text.length > 1 && !/^[\x00-\x1F]+$/.test(text))
      .join(" ");

    if (extractedText.length > 50) {
      return extractedText;
    }

    const streamMatch = content.match(/stream\s*([\s\S]*?)\s*endstream/g);
    if (streamMatch) {
      const allText = streamMatch
        .map((stream) => {
          const inner = stream.replace(/^stream\s*/, "").replace(/\s*endstream$/, "");
          return inner.replace(/[^\x20-\x7E\u0600-\u06FF\s]/g, " ");
        })
        .join(" ");
      return allText.replace(/\s+/g, " ").trim();
    }

    return "لم يتم استخراج نص من الملف. قد يكون الملف مشفراً أو يحتوي على صور فقط.";
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return "حدث خطأ أثناء استخراج النص من ملف PDF.";
  }
}

function extractTextFromDOCX(buffer: Buffer): string {
  try {
    const content = buffer.toString("utf8");
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const extractedText = textMatches
      .map((match) => {
        const text = match.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "");
        return text;
      })
      .join(" ");

    if (extractedText.length > 10) {
      return extractedText;
    }

    return "لم يتم استخراج نص من ملف Word.";
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    return "حدث خطأ أثناء استخراج النص من ملف Word.";
  }
}

export async function processUploadedFile(fileId: string): Promise<boolean> {
  try {
    const file = await storage.getFile(fileId);
    if (!file) {
      console.error("File not found:", fileId);
      return false;
    }

    const extracted = await extractTextFromFile(file.objectPath, file.type);
    if (!extracted) {
      console.log("Could not extract text from file:", file.name);
      return false;
    }

    await storage.updateFile(fileId, {
      extractedText: extracted.text,
      isProcessed: true,
    });

    console.log(`Processed file ${file.name}: ${extracted.text.length} characters extracted`);
    return true;
  } catch (error) {
    console.error("Error processing file:", error);
    return false;
  }
}

export async function analyzeFileContent(fileId: string): Promise<string | null> {
  try {
    const file = await storage.getFile(fileId);
    if (!file) {
      return null;
    }

    let textToAnalyze = file.extractedText;
    
    if (!textToAnalyze) {
      const extracted = await extractTextFromFile(file.objectPath, file.type);
      if (extracted) {
        textToAnalyze = extracted.text;
        await storage.updateFile(fileId, {
          extractedText: textToAnalyze,
          isProcessed: true,
        });
      }
    }

    if (!textToAnalyze || textToAnalyze.length < 10) {
      return "لم يتم العثور على محتوى كافٍ للتحليل في هذا الملف.";
    }

    const analysis = await analyzeDocument(textToAnalyze);
    return analysis;
  } catch (error) {
    console.error("Error analyzing file:", error);
    return null;
  }
}

export async function searchInFiles(
  userId: string,
  query: string
): Promise<Array<{ fileId: string; fileName: string; matchedText: string }>> {
  try {
    const files = await storage.getFiles(userId);
    const results: Array<{ fileId: string; fileName: string; matchedText: string }> = [];

    const queryLower = query.toLowerCase();

    for (const file of files) {
      if (!file.extractedText) continue;

      const textLower = file.extractedText.toLowerCase();
      const index = textLower.indexOf(queryLower);

      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(file.extractedText.length, index + query.length + 50);
        const matchedText = file.extractedText.slice(start, end);

        results.push({
          fileId: file.id,
          fileName: file.name,
          matchedText: `...${matchedText}...`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching files:", error);
    return [];
  }
}
