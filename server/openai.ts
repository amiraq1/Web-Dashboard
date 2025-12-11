import OpenAI from "openai";
import type { ParsedIntent, IntentType } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export async function parseUserIntent(message: string): Promise<ParsedIntent> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت مساعد ذكي لمنصة نبض لإدارة المشاريع. حلل طلب المستخدم وحدد النية (intent) والتفاصيل المطلوبة.

أنواع النوايا المتاحة:
- analyze_data: تحليل بيانات من ملفات أو مصادر
- create_report: إنشاء تقرير جديد
- summarize: تلخيص محتوى أو ملف
- search_files: البحث في الملفات
- create_project: إنشاء مشروع جديد
- create_task: إنشاء مهمة جديدة
- general_query: استفسار عام

أجب بصيغة JSON فقط:
{
  "intent": "نوع_النية",
  "project": "اسم المشروع إن وجد",
  "inputs": {
    "files": ["قائمة الملفات إن وجدت"],
    "timeRange": "الفترة الزمنية إن وجدت",
    "query": "نص الاستفسار"
  },
  "outputFormat": "markdown|json|pdf|html",
  "priority": "low|normal|high",
  "confidence": 0.0-1.0
}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      intent: result.intent || "general_query",
      project: result.project,
      inputs: result.inputs,
      outputFormat: result.outputFormat || "markdown",
      priority: result.priority || "normal",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Error parsing intent:", error);
    return {
      intent: "general_query",
      inputs: { query: message },
      confidence: 0.3,
    };
  }
}

export async function generateResponse(
  userMessage: string,
  context?: {
    projectName?: string;
    recentTasks?: Array<{ title: string; status: string }>;
    fileNames?: string[];
  }
): Promise<string> {
  try {
    let systemPrompt = `أنت نبض، مساعد ذكي لإدارة المشاريع. أجب باللغة العربية بطريقة ودية ومختصرة.`;

    if (context) {
      if (context.projectName) {
        systemPrompt += `\n\nأنت تعمل على مشروع: ${context.projectName}`;
      }
      if (context.recentTasks && context.recentTasks.length > 0) {
        systemPrompt += `\n\nالمهام الأخيرة:\n${context.recentTasks.map(t => `- ${t.title} (${t.status})`).join("\n")}`;
      }
      if (context.fileNames && context.fileNames.length > 0) {
        systemPrompt += `\n\nالملفات المتاحة:\n${context.fileNames.join(", ")}`;
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "عذراً، لم أتمكن من معالجة طلبك.";
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("فشل في توليد الرد");
  }
}

export async function analyzeDocument(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت محلل مستندات خبير. حلل المحتوى التالي وقدم ملخصاً شاملاً يتضمن:
1. النقاط الرئيسية
2. البيانات المهمة (أرقام، تواريخ، إحصائيات)
3. الاستنتاجات
4. التوصيات إن وجدت

أجب باللغة العربية.`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "لم يتم العثور على محتوى للتحليل.";
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw new Error("فشل في تحليل المستند");
  }
}

export async function createTasksFromIntent(
  intent: ParsedIntent,
  projectId: string
): Promise<Array<{ title: string; description: string; priority: string }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `بناءً على النية المحللة، أنشئ قائمة مهام مفصلة لتنفيذ الطلب.
أجب بصيغة JSON مصفوفة من المهام:
[
  {
    "title": "عنوان المهمة",
    "description": "وصف المهمة بالتفصيل",
    "priority": "low|normal|high|urgent"
  }
]`,
        },
        {
          role: "user",
          content: JSON.stringify(intent),
        },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.tasks || [];
  } catch (error) {
    console.error("Error creating tasks:", error);
    return [];
  }
}

export { openai };
