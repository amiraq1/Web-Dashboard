import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { parseUserIntent, generateResponse, createTasksFromIntent } from "../openai";
import { chatLimiter } from "../middleware/rateLimiter";

export function registerChatRoutes(app: Express) {
  // Get messages
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get project messages
  app.get("/api/projects/:projectId/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const messages = await storage.getMessages(userId, req.params.projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting project messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // General chat endpoint
  app.post("/api/chat", isAuthenticated, chatLimiter, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      // Save user message
      await storage.createMessage({
        userId,
        role: "user",
        content: message,
      });

      // Parse intent
      const intent = await parseUserIntent(message);

      // Generate response based on intent
      let responseContent: string;
      let createdTasks: Array<{ title: string; description: string; priority: string }> = [];

      if (intent.intent === "create_project" && intent.inputs?.query) {
        // Create a new project
        const project = await storage.createProject({
          userId,
          name: intent.inputs.query,
          description: "",
        });
        responseContent = `تم إنشاء المشروع "${project.name}" بنجاح. يمكنك الآن إضافة المهام إليه.`;
      } else if (intent.intent === "create_task" && intent.project) {
        // Find project and create tasks
        const projects = await storage.getProjects(userId);
        const project = projects.find(p => 
          p.name.includes(intent.project!) || intent.project!.includes(p.name)
        );
        
        if (project) {
          createdTasks = await createTasksFromIntent(intent, project.id);
          for (const taskData of createdTasks) {
            await storage.createTask({
              projectId: project.id,
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority,
            });
          }
          responseContent = `تم إنشاء ${createdTasks.length} مهام في مشروع "${project.name}".`;
        } else {
          responseContent = await generateResponse(message);
        }
      } else {
        // General response
        const recentTasks = await storage.getRecentTasks(userId, 5);
        responseContent = await generateResponse(message, {
          recentTasks: recentTasks.map(t => ({ title: t.title, status: t.status })),
        });
      }

      // Save assistant message
      await storage.createMessage({
        userId,
        role: "assistant",
        content: responseContent,
        metadata: { intent, createdTasks },
      });

      res.json({
        message: responseContent,
        intent,
        createdTasks,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project-specific chat
  app.post("/api/projects/:projectId/chat", isAuthenticated, chatLimiter, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { projectId } = req.params;
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Save user message
      await storage.createMessage({
        userId,
        projectId,
        role: "user",
        content: message,
      });

      // Parse intent
      const intent = await parseUserIntent(message);

      // Generate response
      let responseContent: string;
      let createdTasks: Array<{ title: string; description: string; priority: string }> = [];

      if (intent.intent === "create_task") {
        createdTasks = await createTasksFromIntent(intent, projectId);
        for (const taskData of createdTasks) {
          await storage.createTask({
            projectId,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
          });
        }
        responseContent = createdTasks.length > 0
          ? `تم إنشاء ${createdTasks.length} مهام جديدة.`
          : await generateResponse(message, { projectName: project.name });
      } else {
        const tasks = await storage.getTasks(projectId);
        const files = await storage.getProjectFiles(projectId);
        responseContent = await generateResponse(message, {
          projectName: project.name,
          recentTasks: tasks.slice(0, 5).map(t => ({ title: t.title, status: t.status })),
          fileNames: files.map(f => f.name),
        });
      }

      // Save assistant message
      await storage.createMessage({
        userId,
        projectId,
        role: "assistant",
        content: responseContent,
        metadata: { intent, createdTasks },
      });

      res.json({
        message: responseContent,
        intent,
        createdTasks,
      });
    } catch (error) {
      console.error("Error in project chat:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
