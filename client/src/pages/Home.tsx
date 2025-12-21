import { useQuery } from "@tanstack/react-query";
import { FolderKanban, CheckCircle2, FileText, Sparkles, Lightbulb } from "lucide-react";
import { CommandBar } from "@/components/CommandBar";
import { ProjectCard } from "@/components/ProjectCard";
import { StatsCard } from "@/components/StatsCard";
import { Timeline } from "@/components/Timeline";
import { TipsCard } from "@/components/TipsCard";
import {
  ProjectCardSkeleton,
  StatsCardSkeleton,
  TimelineItemSkeleton,
} from "@/components/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Project, Task, Tip } from "@shared/schema";

interface DashboardStats {
  totalProjects: number;
  completedTasks: number;
  totalFiles: number;
  aiUsage: number;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/recent"],
  });

  const { data: tips, isLoading: tipsLoading } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const chatMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest("POST", "/api/chat", { message: command });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم تنفيذ الأمر",
        description: data.message || "تمت معالجة طلبك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في معالجة الطلب",
        variant: "destructive",
      });
    },
  });

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "مساء الخير";
  };

  const getUserFirstName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split("@")[0];
    return "المستخدم";
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">
          {getUserGreeting()}، {getUserFirstName()}
        </h1>
        <p className="text-lg text-muted-foreground">
          ماذا تود أن تنجز اليوم؟
        </p>
      </div>

      <CommandBar
        onSubmit={(command) => chatMutation.mutate(command)}
        isLoading={chatMutation.isPending}
        className="max-w-4xl"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="المشاريع"
              value={stats?.totalProjects || 0}
              icon={FolderKanban}
              description="مشاريع نشطة"
            />
            <StatsCard
              title="المهام المكتملة"
              value={stats?.completedTasks || 0}
              icon={CheckCircle2}
              description="هذا الشهر"
            />
            <StatsCard
              title="الملفات"
              value={stats?.totalFiles || 0}
              icon={FileText}
              description="ملفات مرفوعة"
            />
            <StatsCard
              title="استخدام الذكاء"
              value={stats?.aiUsage || 0}
              icon={Sparkles}
              description="طلبات هذا الشهر"
            />
          </>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">المشاريع الأخيرة</h2>
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-primary hover:underline"
              data-testid="link-view-all-projects"
            >
              عرض الكل
            </button>
          </div>

          {projectsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.slice(0, 4).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">لا توجد مشاريع</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                أنشئ مشروعك الأول لبدء إدارة مهامك
              </p>
              <button
                onClick={() => navigate("/projects/new")}
                className="text-sm text-primary hover:underline"
                data-testid="button-create-first-project"
              >
                إنشاء مشروع جديد
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">النشاط الأخير</h2>
          {tasksLoading ? (
            <div className="space-y-4">
              <TimelineItemSkeleton />
              <TimelineItemSkeleton />
            </div>
          ) : (
            <Timeline tasks={recentTasks || []} />
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">نصائح مفيدة</h2>
          </div>
          <button
            onClick={() => navigate("/tips")}
            className="text-sm text-primary hover:underline"
          >
            عرض المزيد
          </button>
        </div>

        {tipsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
                <div className="mb-3 flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted"></div>
                    <div className="h-3 w-full rounded bg-muted"></div>
                    <div className="h-3 w-5/6 rounded bg-muted"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tips && tips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tips.slice(0, 3).map((tip) => (
              <TipsCard key={tip.id} tip={tip} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
