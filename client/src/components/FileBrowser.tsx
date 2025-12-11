import {
  FileText,
  FileImage,
  File,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileRecord } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FileBrowserProps {
  files: FileRecord[];
  onView?: (file: FileRecord) => void;
  onDownload?: (file: FileRecord) => void;
  onDelete?: (file: FileRecord) => void;
  className?: string;
}

const fileTypeConfig: Record<string, { icon: typeof FileText; color: string }> = {
  "application/pdf": { icon: FileText, color: "text-destructive" },
  "text/plain": { icon: FileText, color: "text-muted-foreground" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    color: "text-primary",
  },
  "image/png": { icon: FileImage, color: "text-chart-2" },
  "image/jpeg": { icon: FileImage, color: "text-chart-2" },
  "image/gif": { icon: FileImage, color: "text-chart-2" },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  return fileTypeConfig[type]?.icon || File;
}

function getFileColor(type: string) {
  return fileTypeConfig[type]?.color || "text-muted-foreground";
}

export function FileBrowser({
  files,
  onView,
  onDownload,
  onDelete,
  className,
}: FileBrowserProps) {
  if (files.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">لا توجد ملفات</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          ارفع ملفاتك لتتمكن من تحليلها أو البحث فيها
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6", className)}>
      {files.map((file) => {
        const FileIcon = getFileIcon(file.type);
        const iconColor = getFileColor(file.type);
        const timeAgo = file.createdAt
          ? formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: ar })
          : "";

        return (
          <Card
            key={file.id}
            className="group cursor-pointer transition-all duration-200 hover-elevate"
            onClick={() => onView?.(file)}
            data-testid={`file-card-${file.id}`}
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <FileIcon className={cn("h-6 w-6", iconColor)} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      data-testid={`button-file-menu-${file.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView?.(file);
                      }}
                    >
                      <Eye className="ml-2 h-4 w-4" />
                      عرض
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload?.(file);
                      }}
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تحميل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(file);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <h4 className="mb-1 line-clamp-2 text-sm font-medium leading-tight">
                {file.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span className="text-border">•</span>
                <span>{timeAgo}</span>
              </div>
              {file.isProcessed && (
                <div className="mt-2 flex items-center gap-1 text-xs text-chart-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                  تمت المعالجة
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
