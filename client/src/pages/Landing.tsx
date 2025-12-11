import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  FolderKanban, 
  FileText, 
  MessageSquare,
  Zap,
  Shield,
  ArrowLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const features = [
    {
      icon: MessageSquare,
      title: "أوامر بالعربي",
      description: "تحدث مع نبض بلغتك الطبيعية واترك الباقي عليه"
    },
    {
      icon: FolderKanban,
      title: "إدارة المشاريع",
      description: "نظّم مشاريعك ومهامك بطريقة ذكية وفعّالة"
    },
    {
      icon: FileText,
      title: "تحليل الملفات",
      description: "ارفع ملفاتك واطلب تحليلها أو تلخيصها بسهولة"
    },
    {
      icon: Zap,
      title: "تنفيذ تلقائي",
      description: "وكلاء ذكية تنفذ المهام نيابةً عنك"
    },
    {
      icon: Sparkles,
      title: "ذكاء اصطناعي",
      description: "تقنيات متقدمة لفهم احتياجاتك وتلبيتها"
    },
    {
      icon: Shield,
      title: "أمان تام",
      description: "بياناتك محمية ومشفرة بأعلى المعايير"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">نبض</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">
                <ArrowLeft className="ml-2 h-4 w-4" />
                تسجيل الدخول
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 text-center md:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                منصة ذكية بالذكاء الاصطناعي
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                أدر مشاريعك بقوة
                <span className="block text-primary">الذكاء الاصطناعي</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                نبض يفهم أوامرك بالعربية ويحولها إلى مهام قابلة للتنفيذ.
                ارفع ملفاتك، اطلب تحليلها، وتابع تقدم مشاريعك في مكان واحد.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">
                    ابدأ الآن مجاناً
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                كل ما تحتاجه في مكان واحد
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                أدوات متكاملة لإدارة أعمالك بكفاءة وذكاء
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="group transition-all duration-200 hover-elevate">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
            <h2 className="text-3xl font-bold md:text-4xl">
              جاهز للبدء؟
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              انضم إلى آلاف المستخدمين الذين يديرون مشاريعهم بذكاء
            </p>
            <Button size="lg" className="mt-8" asChild data-testid="button-cta-start">
              <a href="/api/login">
                ابدأ رحلتك مع نبض
                <ArrowLeft className="mr-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground md:px-8">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} نبض</p>
        </div>
      </footer>
    </div>
  );
}
