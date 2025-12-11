import {
  users,
  projects,
  tasks,
  files,
  messages,
  tips,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type FileRecord,
  type InsertFile,
  type Message,
  type InsertMessage,
  type Tip,
  type InsertTip,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  
  // Task operations
  getTasks(projectId: string): Promise<Task[]>;
  getRecentTasks(userId: string, limit?: number): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // File operations
  getFiles(userId: string): Promise<FileRecord[]>;
  getProjectFiles(projectId: string): Promise<FileRecord[]>;
  getFile(id: string): Promise<FileRecord | undefined>;
  createFile(file: InsertFile): Promise<FileRecord>;
  updateFile(id: string, updates: Partial<InsertFile>): Promise<FileRecord | undefined>;
  deleteFile(id: string): Promise<void>;
  
  // Message operations
  getMessages(userId: string, projectId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Stats operations
  getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    completedTasks: number;
    totalFiles: number;
    aiUsage: number;
  }>;
  
  // Tips operations
  getTips(category?: string): Promise<Tip[]>;
  getTip(id: string): Promise<Tip | undefined>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: string, updates: Partial<InsertTip>): Promise<Tip | undefined>;
  deleteTip(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Task operations
  async getTasks(projectId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(tasks.order, desc(tasks.createdAt));
  }

  async getRecentTasks(userId: string, limit = 10): Promise<Task[]> {
    // Use a single efficient query with JOIN instead of fetching all projects first
    return db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        agentType: tasks.agentType,
        result: tasks.result,
        inputs: tasks.inputs,
        outputs: tasks.outputs,
        errorMessage: tasks.errorMessage,
        retryCount: tasks.retryCount,
        order: tasks.order,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(limit);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // File operations
  async getFiles(userId: string): Promise<FileRecord[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));
  }

  async getProjectFiles(projectId: string): Promise<FileRecord[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.createdAt));
  }

  async getFile(id: string): Promise<FileRecord | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<FileRecord> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async updateFile(id: string, updates: Partial<InsertFile>): Promise<FileRecord | undefined> {
    const [file] = await db
      .update(files)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Message operations
  async getMessages(userId: string, projectId?: string): Promise<Message[]> {
    if (projectId) {
      return db
        .select()
        .from(messages)
        .where(and(eq(messages.userId, userId), eq(messages.projectId, projectId)))
        .orderBy(messages.createdAt);
    }
    return db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Stats operations
  async getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    completedTasks: number;
    totalFiles: number;
    aiUsage: number;
  }> {
    const userProjects = await this.getProjects(userId);
    const projectIds = userProjects.map(p => p.id);
    
    let completedTasks = 0;
    if (projectIds.length > 0) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            sql`${tasks.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
            eq(tasks.status, "completed")
          )
        );
      completedTasks = Number(result[0]?.count || 0);
    }

    const filesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.userId, userId));
    const totalFiles = Number(filesResult[0]?.count || 0);

    const messagesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.userId, userId));
    const aiUsage = Number(messagesResult[0]?.count || 0);

    return {
      totalProjects: userProjects.length,
      completedTasks,
      totalFiles,
      aiUsage,
    };
  }

  // Tips operations
  async getTips(category?: string): Promise<Tip[]> {
    if (category) {
      return db
        .select()
        .from(tips)
        .where(and(eq(tips.category, category), eq(tips.isActive, true)))
        .orderBy(tips.order, desc(tips.createdAt));
    }
    return db
      .select()
      .from(tips)
      .where(eq(tips.isActive, true))
      .orderBy(tips.order, desc(tips.createdAt));
  }

  async getTip(id: string): Promise<Tip | undefined> {
    const [tip] = await db.select().from(tips).where(eq(tips.id, id));
    return tip;
  }

  async createTip(tip: InsertTip): Promise<Tip> {
    const [newTip] = await db.insert(tips).values(tip).returning();
    return newTip;
  }

  async updateTip(id: string, updates: Partial<InsertTip>): Promise<Tip | undefined> {
    const [tip] = await db
      .update(tips)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tips.id, id))
      .returning();
    return tip;
  }

  async deleteTip(id: string): Promise<void> {
    await db.delete(tips).where(eq(tips.id, id));
  }
}

export const storage = new DatabaseStorage();
