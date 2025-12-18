import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents table - stores metadata for uploaded and created documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner of the document */
  userId: int("userId").notNull(),
  /** Document title */
  title: varchar("title", { length: 500 }).notNull(),
  /** Document type: imported, created, template */
  type: mysqlEnum("type", ["imported", "created", "template"]).default("imported").notNull(),
  /** File type: pdf, docx, txt, etc. */
  fileType: varchar("fileType", { length: 50 }),
  /** S3 storage key */
  fileKey: varchar("fileKey", { length: 500 }),
  /** Public URL to access the file */
  fileUrl: text("fileUrl"),
  /** File size in bytes */
  fileSize: int("fileSize"),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 100 }),
  /** Document description */
  description: text("description"),
  /** Additional metadata as JSON */
  metadata: json("metadata"),
  /** Whether the document has been processed for RAG */
  isProcessed: mysqlEnum("isProcessed", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  /** Visibility: private, shared, public */
  visibility: mysqlEnum("visibility", ["private", "shared", "public"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Document chunks for RAG - stores text segments with embeddings
 */
export const documentChunks = mysqlTable("document_chunks", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to parent document */
  documentId: int("documentId").notNull(),
  /** Chunk index within the document */
  chunkIndex: int("chunkIndex").notNull(),
  /** Text content of the chunk */
  content: text("content").notNull(),
  /** Embedding vector stored as JSON array */
  embedding: json("embedding"),
  /** Start position in original document */
  startPosition: int("startPosition"),
  /** End position in original document */
  endPosition: int("endPosition"),
  /** Token count for this chunk */
  tokenCount: int("tokenCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;

/**
 * User settings - stores user preferences and configuration
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** UI theme preference */
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
  /** Preferred language */
  language: varchar("language", { length: 10 }).default("fr").notNull(),
  /** OpenAI voice preference */
  voicePreference: varchar("voicePreference", { length: 50 }).default("cedar"),
  /** Default document visibility */
  defaultVisibility: mysqlEnum("defaultVisibility", ["private", "shared", "public"]).default("private").notNull(),
  /** Enable voice features */
  voiceEnabled: mysqlEnum("voiceEnabled", ["true", "false"]).default("true").notNull(),
  /** Additional settings as JSON */
  additionalSettings: json("additionalSettings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Document permissions - controls access to documents by user
 */
export const documentPermissions = mysqlTable("document_permissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Document being shared */
  documentId: int("documentId").notNull(),
  /** User receiving access */
  userId: int("userId").notNull(),
  /** Permission level */
  permission: mysqlEnum("permission", ["read", "write", "admin"]).default("read").notNull(),
  /** Who granted the permission */
  grantedBy: int("grantedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;
