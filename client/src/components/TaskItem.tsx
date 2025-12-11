import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Trash2,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onRun?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
  onToggleComplete?: () => void;
  onClick?: () => void;
}

const statusConfig = {
  pending: {
    label: "في الانتظار",
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  running: {
    label: "قيد التنفيذ",
    icon: Loader2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    animate: true,
  },
  completed: {
    label: "مكتمل",
    icon: CheckCircle2,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  failed: {
    label: "فشل",
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

const priorityConfig = {
  low: { label: "منخفض", color: "bg-muted text-muted-foreground" },
  normal: { label: "عادي", color: "bg-secondary text-secondary-foreground" },
  high: { label: "مرتفع", color: "bg-chart-3/10 text-chart-3" },
  urgent: { label: "عاجل", color: "bg-destructive/10 text-destructive" },
};

export function TaskItem({
  task,
  onRun,
  onRetry,
  onDelete,
  onToggleComplete,
  onClick,
}: TaskItemProps) {
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const StatusIcon = status.icon;
  
  const timeAgo = task.updatedAt
    ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: ar })
    : "";

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== "running") {
      onToggleComplete?.();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 border-b px-6 py-4 transition-colors hover-elevate cursor-pointer",
        task.status === "completed" && "opacity-60"
      )}
      onClick={onClick}
      data-testid={`task-item-${task.id}`}
    >
      <button
        onClick={handleStatusClick}
        className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90", status.bgColor)}
        data-testid={`button-toggle-task-${task.id}`}
        disabled={task.status === "running"}
      >
        <StatusIcon className={cn("h-4 w-4", status.color, status.animate && "animate-spin")} />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium",
            task.status === "completed" && "line-through"
          )}>
            {task.title}
          </h4>
          <Badge variant="outline" className={cn("text-xs", priority.color)}>
            {priority.label}
          </Badge>
        </div>
        {task.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.agentType && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {task.agentType}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          {task.retryCount > 0 && (
            <span className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {task.retryCount} محاولات
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            data-testid={`button-task-menu-${task.id}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.status === "pending" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRun?.();
              }}
            >
              <Play className="ml-2 h-4 w-4" />
              تشغيل
            </DropdownMenuItem>
          )}
          {task.status === "failed" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRetry?.();
              }}
            >
              <RotateCcw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
