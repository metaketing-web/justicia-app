import { eq, and, or, desc, asc, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  documents, InsertDocument, Document,
  documentChunks, InsertDocumentChunk,
  userSettings, InsertUserSettings,
  documentPermissions, InsertDocumentPermission
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ DOCUMENT FUNCTIONS ============

export async function createDocument(doc: InsertDocument): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(documents).values(doc);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(documents).where(eq(documents.id, insertId)).limit(1);
  return created[0] || null;
}

export async function getDocumentById(id: number): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0] || null;
}

export async function getDocumentsByUserId(
  userId: number, 
  options?: { 
    limit?: number; 
    offset?: number; 
    type?: "imported" | "created" | "template";
    search?: string;
  }
): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(documents).where(eq(documents.userId, userId));
  
  if (options?.type) {
    query = db.select().from(documents).where(
      and(eq(documents.userId, userId), eq(documents.type, options.type))
    );
  }

  if (options?.search) {
    query = db.select().from(documents).where(
      and(
        eq(documents.userId, userId),
        like(documents.title, `%${options.search}%`)
      )
    );
  }

  const results = await query
    .orderBy(desc(documents.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return results;
}

export async function getAccessibleDocuments(userId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  // Get documents owned by user or shared with user
  const ownedDocs = await db.select().from(documents).where(eq(documents.userId, userId));
  
  const sharedPermissions = await db.select()
    .from(documentPermissions)
    .where(eq(documentPermissions.userId, userId));
  
  const sharedDocIds = sharedPermissions.map(p => p.documentId);
  
  if (sharedDocIds.length === 0) return ownedDocs;

  const sharedDocs = await db.select()
    .from(documents)
    .where(sql`${documents.id} IN (${sql.join(sharedDocIds.map(id => sql`${id}`), sql`, `)})`);

  return [...ownedDocs, ...sharedDocs];
}

export async function updateDocument(
  id: number, 
  updates: Partial<Omit<InsertDocument, "id" | "userId" | "createdAt">>
): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(documents).set(updates).where(eq(documents.id, id));
  return getDocumentById(id);
}

export async function deleteDocument(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Delete associated chunks first
  await db.delete(documentChunks).where(eq(documentChunks.documentId, id));
  // Delete permissions
  await db.delete(documentPermissions).where(eq(documentPermissions.documentId, id));
  // Delete document
  await db.delete(documents).where(eq(documents.id, id));
  return true;
}

// ============ DOCUMENT CHUNKS FUNCTIONS (RAG) ============

export async function createDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void> {
  const db = await getDb();
  if (!db || chunks.length === 0) return;

  await db.insert(documentChunks).values(chunks);
}

export async function getChunksByDocumentId(documentId: number): Promise<typeof documentChunks.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(asc(documentChunks.chunkIndex));
}

export async function deleteChunksByDocumentId(documentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));
}

export async function getAllChunksForUser(userId: number): Promise<Array<typeof documentChunks.$inferSelect & { documentTitle: string }>> {
  const db = await getDb();
  if (!db) return [];

  const userDocs = await getDocumentsByUserId(userId, { limit: 1000 });
  const docIds = userDocs.map(d => d.id);
  
  if (docIds.length === 0) return [];

  const chunks = await db.select()
    .from(documentChunks)
    .where(sql`${documentChunks.documentId} IN (${sql.join(docIds.map(id => sql`${id}`), sql`, `)})`);

  const docMap = new Map(userDocs.map(d => [d.id, d.title]));
  
  return chunks.map(chunk => ({
    ...chunk,
    documentTitle: docMap.get(chunk.documentId) || "Unknown"
  }));
}

// ============ USER SETTINGS FUNCTIONS ============

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(userSettings).values(settings).onDuplicateKeyUpdate({
    set: {
      theme: settings.theme,
      language: settings.language,
      voicePreference: settings.voicePreference,
      defaultVisibility: settings.defaultVisibility,
      voiceEnabled: settings.voiceEnabled,
      additionalSettings: settings.additionalSettings,
    }
  });

  return getUserSettings(settings.userId);
}

// ============ DOCUMENT PERMISSIONS FUNCTIONS ============

export async function createDocumentPermission(permission: InsertDocumentPermission) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(documentPermissions).values(permission);
  return permission;
}

export async function getDocumentPermissions(documentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(documentPermissions).where(eq(documentPermissions.documentId, documentId));
}

export async function checkDocumentAccess(documentId: number, userId: number): Promise<"owner" | "read" | "write" | "admin" | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if user is owner
  const doc = await getDocumentById(documentId);
  if (!doc) return null;
  if (doc.userId === userId) return "owner";

  // Check permissions
  const perms = await db.select()
    .from(documentPermissions)
    .where(and(
      eq(documentPermissions.documentId, documentId),
      eq(documentPermissions.userId, userId)
    ))
    .limit(1);

  return perms[0]?.permission || null;
}

export async function deleteDocumentPermission(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(documentPermissions).where(
    and(
      eq(documentPermissions.documentId, documentId),
      eq(documentPermissions.userId, userId)
    )
  );
  return true;
}
