import { 
  FolderKanban, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  FileText,
  Trash2,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ProjectCardProps {
  project: Project;
  tasksCount?: number;
  filesCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const statusConfig = {
  active: {
    label: "نشط",
    variant: "default" as const,
  },
  completed: {
    label: "مكتمل",
    variant: "secondary" as const,
  },
  archived: {
    label: "مؤرشف",
    variant: "outline" as const,
  },
};

export function ProjectCard({
  project,
  tasksCount = 0,
  filesCount = 0,
  onEdit,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active;
  const timeAgo = project.updatedAt
    ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ar })
    : "";

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover-elevate"
      onClick={onClick}
      data-testid={`card-project-${project.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{project.name}</h3>
            {project.description && (
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                data-testid={`button-project-menu-${project.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit2 className="ml-2 h-4 w-4" />
                تعديل
              </DropdownMenuItem>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>{tasksCount} مهام</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>{filesCount} ملفات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
