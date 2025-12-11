import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FileBrowser } from "@/components/FileBrowser";
import { FileCardSkeleton } from "@/components/LoadingStates";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FileRecord } from "@shared/schema";

export default function Files() {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);

  const { data: files, isLoading } = useQuery<FileRecord[]>({
    queryKey: ["/api/files"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowDeleteDialog(false);
      setSelectedFile(null);
      toast({
        title: "تم حذف الملف",
        description: "تم حذف الملف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في حذف الملف",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    return {
      method: "PUT" as const,
      url: (response as any).uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      try {
        await apiRequest("POST", "/api/files", {
          name: uploadedFile.name,
          type: uploadedFile.type || "application/octet-stream",
          size: uploadedFile.size,
          uploadURL: uploadedFile.uploadURL,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: "تم رفع الملف",
          description: `تم رفع الملف "${uploadedFile.name}" بنجاح`,
        });
      } catch (error: any) {
        toast({
          title: "حدث خطأ",
          description: error.message || "فشل في حفظ معلومات الملف",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = () => {
    if (selectedFile) {
      deleteMutation.mutate(selectedFile.id);
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">الملفات</h1>
          <p className="mt-1 text-muted-foreground">
            إدارة ملفاتك ومستنداتك المرفوعة
          </p>
        </div>
        <ObjectUploader
          maxNumberOfFiles={5}
          maxFileSize={52428800}
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
        >
          <Upload className="ml-2 h-5 w-5" />
          رفع ملفات
        </ObjectUploader>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <FileCardSkeleton />
          <FileCardSkeleton />
          <FileCardSkeleton />
          <FileCardSkeleton />
          <FileCardSkeleton />
          <FileCardSkeleton />
        </div>
      ) : files && files.length > 0 ? (
        <FileBrowser
          files={files}
          onView={(file) => window.open(`/objects/${file.objectPath.split("/").pop()}`, "_blank")}
          onDownload={(file) => window.open(`/objects/${file.objectPath.split("/").pop()}`, "_blank")}
          onDelete={(file) => {
            setSelectedFile(file);
            setShowDeleteDialog(true);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">لا توجد ملفات</h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            ارفع ملفاتك لتتمكن من تحليلها والبحث فيها باستخدام الذكاء الاصطناعي
          </p>
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={52428800}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
          >
            <Upload className="ml-2 h-5 w-5" />
            رفع ملفات
          </ObjectUploader>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الملف "{selectedFile?.name}" نهائياً.
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-file">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-file"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
