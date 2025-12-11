import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";

export function registerTaskRoutes(app: Express) {
  // Get tasks for a project
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent tasks
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

  // Create task
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

  // Update task
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

  // Delete task
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
}
