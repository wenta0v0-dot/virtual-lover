import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 11 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  password: varchar("password", { length: 255 }),
  avatar: text("avatar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 11 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    used: integer("used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_codes_phone_idx").on(table.phone)],
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    characterId: varchar("character_id", { length: 100 }).notNull(),
    characterName: varchar("character_name", { length: 255 }).notNull(),
    characterAvatar: text("character_avatar"),
    lastMessage: text("last_message"),
    messageCount: integer("message_count").notNull().default(0),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chat_sessions_user_id_idx").on(table.userId),
    index("chat_sessions_character_id_idx").on(table.characterId),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => chatSessions.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    isStreaming: boolean("is_streaming").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chat_messages_session_id_idx").on(table.sessionId),
    index("chat_messages_user_id_idx").on(table.userId),
  ],
);

export const imageGenerations = pgTable(
  "image_generations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    prompt: text("prompt").notNull(),
    size: varchar("size", { length: 20 }).default("1280x1280"),
    referenceImageUrl: varchar("reference_image_url", { length: 500 }),
    imageUrls: jsonb("image_urls").$type<string[]>(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("image_generations_user_id_idx").on(table.userId)],
);

// 自定义角色表
export const customCharacters = pgTable("custom_characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 100 }),
  tags: jsonb("tags").$type<string[]>(),
  avatar: varchar("avatar", { length: 10 }),
  avatarImage: varchar("avatar_image", { length: 500 }),
  gender: varchar("gender", { length: 10 }),
  appearance: text("appearance"),
  systemPrompt: text("system_prompt").notNull(),
  greeting: text("greeting").notNull(),
  color: varchar("color", { length: 7 }),
  status: varchar("status", { length: 200 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type NewImageGeneration = typeof imageGenerations.$inferInsert;
export type CustomCharacter = typeof customCharacters.$inferSelect;
export type NewCustomCharacter = typeof customCharacters.$inferInsert;
