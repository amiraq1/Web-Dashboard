import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Sparkles, FolderKanban, CheckCircle2, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import type { Tip } from "@shared/schema";

const categoryIcons: Record<string, any> = {
  general: Sparkles,
  projects: FolderKanban,
  tasks: CheckCircle2,
  files: FileText,
  chat: MessageSquare,
  productivity: Lightbulb,
};

const categoryNames: Record<string, string> = {
  general: "عام",
  projects: "المشاريع",
  tasks: "المهام",
  files: "الملفات",
  chat: "المحادثة",
  productivity: "الإنتاجية",
};

export default function Tips() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ["/api/tips", selectedCategory],
    queryFn: async () => {
      const params = selectedCategory ? `?category=${selectedCategory}` : "";
      const response = await fetch(`/api/tips${params}`);
      if (!response.ok) throw new Error("Failed to fetch tips");
      return response.json();
    },
  });

  const categories = Object.keys(categoryNames);

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">نصائح وإرشادات</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          تعلم كيفية استخدام المنصة بشكل أفضل من خلال هذه النصائح المفيدة
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          الكل
        </button>
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="h-4 w-4" />
              {categoryNames[category]}
            </button>
          );
        })}
      </div>

      {/* Tips Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border bg-card p-6"
            >
              <div className="mb-4 h-8 w-8 rounded-full bg-muted"></div>
              <div className="mb-2 h-6 w-3/4 rounded bg-muted"></div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted"></div>
                <div className="h-4 w-5/6 rounded bg-muted"></div>
                <div className="h-4 w-4/6 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tips && tips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => {
            const Icon = categoryIcons[tip.category] || Lightbulb;
            return (
              <div
                key={tip.id}
                className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold">{tip.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tip.content}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {categoryNames[tip.category] || tip.category}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lightbulb className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">لا توجد نصائح</h3>
          <p className="text-sm text-muted-foreground">
            لم نجد أي نصائح في هذا التصنيف حاليًا
          </p>
        </div>
      )}
    </div>
  );
}
