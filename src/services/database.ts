import { getDb } from "@/db";
import {
  users,
  chatSessions,
  chatMessages,
  imageGenerations,
} from "@/db/schema";
import type {
  NewChatSession,
  NewChatMessage,
  NewImageGeneration,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getOrCreateChatSession(
  userId: number,
  characterId: string,
  characterName: string,
  characterAvatar?: string,
) {
  const db = getDb();

  const existingSession = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.characterId, characterId),
      ),
    )
    .limit(1);

  if (existingSession.length > 0) {
    return existingSession[0];
  }

  const newSession: NewChatSession = {
    userId,
    characterId,
    characterName,
    characterAvatar: characterAvatar || null,
  };

  const created = await db.insert(chatSessions).values(newSession).returning();

  return created[0];
}

export async function saveChatMessage(
  sessionId: number,
  userId: number,
  role: "user" | "assistant",
  content: string,
  imageUrl?: string,
) {
  const db = getDb();

  const newMessage: NewChatMessage = {
    sessionId,
    userId,
    role,
    content,
    imageUrl: imageUrl || null,
  };

  const [message] = await db
    .insert(chatMessages)
    .values(newMessage)
    .returning();

  await db
    .update(chatSessions)
    .set({
      lastMessage: content.slice(0, 200),
      messageCount: sql`${chatSessions.messageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId));

  return message;
}

export async function getChatHistory(sessionId: number, limit = 200) {
  const db = getDb();

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function getUserChatSessions(userId: number) {
  const db = getDb();

  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

export async function recordImageGeneration(
  userId: number,
  prompt: string,
  size: string,
  imageUrls: string[],
  status: "pending" | "success" | "failed",
  errorMessage?: string,
  retryCount?: number,
  referenceImageUrl?: string,
) {
  const db = getDb();

  const newRecord: NewImageGeneration = {
    userId,
    prompt,
    size,
    imageUrls,
    status,
    errorMessage: errorMessage || null,
    retryCount: retryCount || 0,
    referenceImageUrl: referenceImageUrl || null,
  };

  return db.insert(imageGenerations).values(newRecord).returning();
}

export async function getUserImageGenerations(userId: number, limit = 20) {
  const db = getDb();

  return db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.userId, userId))
    .orderBy(desc(imageGenerations.createdAt))
    .limit(limit);
}

export async function updateImageGenerationStatus(
  id: number,
  status: "success" | "failed",
  imageUrls?: string[],
  errorMessage?: string,
) {
  const db = getDb();

  return db
    .update(imageGenerations)
    .set({
      status,
      ...(imageUrls && { imageUrls }),
      ...(errorMessage && { errorMessage }),
    })
    .where(eq(imageGenerations.id, id));
}
