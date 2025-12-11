import { Lightbulb } from "lucide-react";
import type { Tip } from "@shared/schema";

interface TipsCardProps {
  tip: Tip;
  icon?: React.ComponentType<{ className?: string }>;
}

export function TipsCard({ tip, icon: Icon = Lightbulb }: TipsCardProps) {
  return (
    <div className="group rounded-lg border bg-card p-4 transition-all hover:shadow-md">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold leading-tight">{tip.title}</h4>
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {tip.content}
          </p>
        </div>
      </div>
    </div>
  );
}
