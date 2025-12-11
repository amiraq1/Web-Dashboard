import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatMessageSkeleton } from "@/components/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat", { message: content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-full flex-col p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">المحادثات</h1>
        <p className="mt-1 text-muted-foreground">
          تحدث مع نبض واطلب ما تحتاجه
        </p>
      </div>

      <div className="flex-1 rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-4">
            <ChatMessageSkeleton />
            <ChatMessageSkeleton />
            <ChatMessageSkeleton />
          </div>
        ) : (
          <ChatInterface
            messages={messages || []}
            user={user}
            onSendMessage={(content) => chatMutation.mutate(content)}
            isLoading={chatMutation.isPending}
            placeholder="اكتب رسالتك هنا أو اطلب مهمة..."
          />
        )}
      </div>
    </div>
  );
}
