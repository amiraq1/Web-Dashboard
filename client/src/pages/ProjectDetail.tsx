import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  ArrowRight,
  Plus,
  MessageSquare,
  FileText,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommandBar } from "@/components/CommandBar";
import { TaskItem } from "@/components/TaskItem";
import { Timeline } from "@/components/Timeline";
import { FileBrowser } from "@/components/FileBrowser";
import { ChatInterface } from "@/components/ChatInterface";
import {
  TaskItemSkeleton,
  FileCardSkeleton,
  FullPageLoader,
} from "@/components/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, Task, FileRecord, Message } from "@shared/schema";

const statusConfig = {
  active: { label: "نشط", variant: "default" as const },
  completed: { label: "مكتمل", variant: "secondary" as const },
  archived: { label: "مؤرشف", variant: "outline" as const },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", id, "tasks"],
  });

  const { data: files, isLoading: filesLoading } = useQuery<FileRecord[]>({
    queryKey: ["/api/projects", id, "files"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/projects", id, "messages"],
  });

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/projects/${id}/chat`, { message: content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; priority: string }) => {
      return apiRequest("POST", `/api/projects/${id}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      setShowTaskDialog(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("normal");
      toast({
        title: "تم إضافة المهمة",
        description: "تمت إضافة المهمة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في إضافة المهمة",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "تم حذف المهمة",
        description: "تم حذف المهمة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في حذف المهمة",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "عنوان المهمة مطلوب",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate({
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      priority: taskPriority,
    });
  };

  if (projectLoading) {
    return <FullPageLoader />;
  }

  if (!project) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold">المشروع غير موجود</h2>
        <p className="mb-4 text-muted-foreground">
          لم يتم العثور على المشروع المطلوب
        </p>
        <Button onClick={() => navigate("/projects")} data-testid="button-back-to-projects">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للمشاريع
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-card/50 p-6">
        <button
          onClick={() => navigate("/projects")}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          data-testid="button-back"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمشاريع
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">التقدم:</span>
              <Progress value={project.progress} className="h-2 w-32" />
              <span className="text-sm font-medium">{project.progress}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" data-testid="button-project-settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowTaskDialog(true)} data-testid="button-add-task">
              <Plus className="ml-2 h-4 w-4" />
              مهمة جديدة
            </Button>
          </div>
        </div>
      </div>

      <CommandBar
        onSubmit={(command) => chatMutation.mutate(command)}
        isLoading={chatMutation.isPending}
        placeholder="اطلب مهمة جديدة أو اسأل عن المشروع..."
        className="mx-6 mt-6 max-w-4xl"
      />

      <Tabs defaultValue="tasks" className="flex-1 p-6">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            <Clock className="ml-2 h-4 w-4" />
            المهام
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Clock className="ml-2 h-4 w-4" />
            التايم لاين
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">
            <FileText className="ml-2 h-4 w-4" />
            الملفات
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageSquare className="ml-2 h-4 w-4" />
            المحادثة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-0">
          {tasksLoading ? (
            <div className="rounded-lg border">
              <TaskItemSkeleton />
              <TaskItemSkeleton />
              <TaskItemSkeleton />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="rounded-lg border">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={() => deleteTaskMutation.mutate(task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-semibold">لا توجد مهام</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                أضف مهمة جديدة أو اطلبها من شريط الأوامر
              </p>
              <Button
                variant="outline"
                onClick={() => setShowTaskDialog(true)}
                data-testid="button-add-first-task"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة مهمة
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <Timeline tasks={tasks || []} />
        </TabsContent>

        <TabsContent value="files" className="mt-0">
          {filesLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <FileCardSkeleton />
              <FileCardSkeleton />
              <FileCardSkeleton />
              <FileCardSkeleton />
            </div>
          ) : (
            <FileBrowser
              files={files || []}
              onView={(file) => window.open(file.objectPath, "_blank")}
              onDownload={(file) => window.open(file.objectPath, "_blank")}
            />
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-0 h-[calc(100vh-400px)]">
          <div className="h-full rounded-lg border">
            <ChatInterface
              messages={messages || []}
              user={user}
              onSendMessage={(content) => chatMutation.mutate(content)}
              isLoading={chatMutation.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مهمة جديدة</DialogTitle>
            <DialogDescription>
              أضف مهمة جديدة للمشروع
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان المهمة</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="مثال: تحليل بيانات المبيعات"
                data-testid="input-task-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الوصف (اختياري)</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="وصف مفصل للمهمة..."
                rows={3}
                data-testid="input-task-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الأولوية</label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="high">مرتفع</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTaskDialog(false)}
              data-testid="button-cancel-task"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending}
              data-testid="button-confirm-task"
            >
              {createTaskMutation.isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
