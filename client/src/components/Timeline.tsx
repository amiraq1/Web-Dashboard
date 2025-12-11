import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimelineProps {
  tasks: Task[];
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    lineColor: "bg-muted",
  },
  running: {
    icon: Loader2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    lineColor: "bg-primary/30",
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    lineColor: "bg-chart-2/30",
  },
  failed: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    lineColor: "bg-destructive/30",
  },
};

export function Timeline({ tasks, className }: TimelineProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">لا توجد مهام</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          أضف مهام جديدة لتتبع تقدم مشروعك
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute right-4 top-0 h-full w-0.5 bg-border" />
      
      <div className="space-y-4">
        {tasks.map((task, index) => {
          const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = status.icon;
          const timeAgo = task.updatedAt
            ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: ar })
            : "";
          const isLast = index === tasks.length - 1;

          return (
            <div key={task.id} className="relative flex gap-4 pr-8" data-testid={`timeline-task-${task.id}`}>
              <div className="absolute right-0 flex flex-col items-center">
                <div
                  className={cn(
                    "z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background",
                    status.bgColor
                  )}
                >
                  <StatusIcon
                    className={cn("h-4 w-4", status.color, status.animate && "animate-spin")}
                  />
                </div>
                {!isLast && (
                  <div className={cn("h-full w-0.5", status.lineColor)} />
                )}
              </div>

              <Card className="flex-1 transition-all hover-elevate">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-xs font-medium text-muted-foreground">
                      {timeAgo}
                    </time>
                  </div>
                  
                  {task.result && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="line-clamp-3 whitespace-pre-wrap">{task.result}</p>
                    </div>
                  )}
                  
                  {task.errorMessage && (
                    <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <p className="line-clamp-2">{task.errorMessage}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {task.agentType && (
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {task.agentType}
                      </span>
                    )}
                    {task.retryCount > 0 && (
                      <span>المحاولة: {task.retryCount}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
