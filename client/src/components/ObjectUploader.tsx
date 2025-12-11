import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Check, AlertCircle } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: {
    successful: Array<{ name: string; type: string; size: number; uploadURL: string }>;
    failed: Array<{ name: string; error: string }>;
  }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

interface FileItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadURL?: string;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileItem[] = [];

    for (const file of selectedFiles) {
      if (files.length + newFiles.length >= maxNumberOfFiles) break;
      
      if (file.size > maxFileSize) {
        newFiles.push({
          file,
          status: "error",
          progress: 0,
          error: `الملف أكبر من ${Math.round(maxFileSize / 1024 / 1024)} ميجابايت`,
        });
      } else {
        newFiles.push({
          file,
          status: "pending",
          progress: 0,
        });
      }
    }

    setFiles([...files, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    const results: {
      successful: Array<{ name: string; type: string; size: number; uploadURL: string }>;
      failed: Array<{ name: string; error: string }>;
    } = {
      successful: [],
      failed: [],
    };

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (fileItem.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      try {
        const { url } = await onGetUploadParameters();
        
        const response = await fetch(url, {
          method: "PUT",
          body: fileItem.file,
          headers: {
            "Content-Type": fileItem.file.type || "application/octet-stream",
          },
        });

        if (response.ok) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "success" as const, progress: 100, uploadURL: url } : f
            )
          );
          results.successful.push({
            name: fileItem.file.name,
            type: fileItem.file.type,
            size: fileItem.file.size,
            uploadURL: url,
          });
        } else {
          throw new Error(`فشل في الرفع: ${response.status}`);
        }
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const, error: error.message } : f
          )
        );
        results.failed.push({
          name: fileItem.file.name,
          error: error.message,
        });
      }
    }

    setIsUploading(false);
    onComplete?.(results);
    
    if (results.successful.length > 0) {
      setTimeout(() => {
        setShowModal(false);
        setFiles([]);
      }, 1500);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / 1024 / 1024).toFixed(1)} ميجابايت`;
  };

  const pendingFiles = files.filter((f) => f.status === "pending");

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        data-testid="button-upload-files"
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>رفع ملفات</DialogTitle>
            <DialogDescription>
              اختر الملفات التي تريد رفعها (الحد الأقصى: {maxNumberOfFiles} ملفات)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 p-6 transition-colors hover:border-primary/50 hover:bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                اضغط هنا لاختيار الملفات
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                الحد الأقصى: {Math.round(maxFileSize / 1024 / 1024)} ميجابايت لكل ملف
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple={maxNumberOfFiles > 1}
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-upload"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      {fileItem.status === "uploading" && (
                        <Progress value={fileItem.progress} className="mt-1 h-1" />
                      )}
                      {fileItem.status === "error" && (
                        <p className="mt-1 text-xs text-destructive">
                          {fileItem.error}
                        </p>
                      )}
                    </div>
                    {fileItem.status === "success" ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : fileItem.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : fileItem.status !== "uploading" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setFiles([]);
                }}
                data-testid="button-cancel-upload"
              >
                إلغاء
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={pendingFiles.length === 0 || isUploading}
                data-testid="button-start-upload"
              >
                {isUploading ? "جاري الرفع..." : `رفع ${pendingFiles.length} ملف`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
