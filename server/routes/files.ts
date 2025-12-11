import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { generateUploadUrl, deleteObject } from "../objectStorage";
import { processUploadedFile, analyzeFileContent, searchInFiles } from "../fileAgent";
import { insertFileSchema } from "@shared/schema";
import { z } from "zod";
import { uploadLimiter } from "../middleware/rateLimiter";

export function registerFileRoutes(app: Express) {
  // Get all files for user
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

  // Get files for a project
  app.get("/api/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getProjectFiles(req.params.projectId);
      res.json(files);
    } catch (error) {
      console.error("Error getting project files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate upload URL
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

  // Create file record
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

  // Analyze file
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

  // Search in files
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

  // Delete file
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
}
