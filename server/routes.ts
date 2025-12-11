import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, setupAuth } from "./replitAuth";
import { parseUserIntent, generateResponse, createTasksFromIntent } from "./openai";
import { generateUploadUrl, deleteObject, getDownloadUrl } from "./objectStorage";
import { processUploadedFile, analyzeFileContent, searchInFiles } from "./fileAgent";
import { insertProjectSchema, insertTaskSchema, insertMessageSchema, insertFileSchema } from "@shared/schema";
import { z } from "zod";
import { apiLimiter, chatLimiter, uploadLimiter } from "./middleware/rateLimiter";

export async function registerRoutes(httpServer: Server, app: Express) {
  await setupAuth(app);

  // Apply general API rate limiting to all /api routes
  app.use("/api", apiLimiter);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Projects routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error getting projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error getting project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const data = insertProjectSchema.parse({
        ...req.body,
        userId,
      });
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tasks routes
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tasks/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tasks = await storage.getRecentTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting recent tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const data = insertTaskSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const task = await storage.createTask(data);
      
      // Update project progress
      const tasks = await storage.getTasks(req.params.projectId);
      const completedCount = tasks.filter(t => t.status === "completed").length;
      const progress = Math.round((completedCount / tasks.length) * 100);
      await storage.updateProject(req.params.projectId, { progress });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update project progress if status changed
      if (req.body.status && task.projectId) {
        const tasks = await storage.getTasks(task.projectId);
        const completedCount = tasks.filter(t => t.status === "completed").length;
        const progress = Math.round((completedCount / tasks.length) * 100);
        await storage.updateProject(task.projectId, { progress });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (task) {
        await storage.deleteTask(req.params.id);
        
        // Update project progress
        const tasks = await storage.getTasks(task.projectId);
        if (tasks.length > 0) {
          const completedCount = tasks.filter(t => t.status === "completed").length;
          const progress = Math.round((completedCount / tasks.length) * 100);
          await storage.updateProject(task.projectId, { progress });
        }
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Files routes
  app.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const files = await storage.getFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getProjectFiles(req.params.projectId);
      res.json(files);
    } catch (error) {
      console.error("Error getting project files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/objects/upload", isAuthenticated, uploadLimiter, async (req, res) => {
    try {
      const fileName = req.body.fileName || `file-${Date.now()}`;
      const result = await generateUploadUrl(fileName);
      res.json(result);
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/files", isAuthenticated, uploadLimiter, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const data = insertFileSchema.parse({
        ...req.body,
        userId,
        objectPath: req.body.uploadURL || req.body.objectPath,
      });
      const file = await storage.createFile(data);
      
      // Process file in background for text extraction
      processUploadedFile(file.id).catch(err => 
        console.error("Background file processing failed:", err)
      );
      
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File analysis endpoint
  app.get("/api/files/:id/analyze", isAuthenticated, async (req, res) => {
    try {
      const analysis = await analyzeFileContent(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "File not found or could not be analyzed" });
      }
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File search endpoint
  app.get("/api/files/search", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await searchInFiles(userId, query);
      res.json(results);
    } catch (error) {
      console.error("Error searching files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (file) {
        await deleteObject(file.objectPath);
        await storage.deleteFile(req.params.id);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Messages routes
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

  // Chat endpoint with AI integration
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
      const assistantMessage = await storage.createMessage({
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

  // Project-specific chat endpoint
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
