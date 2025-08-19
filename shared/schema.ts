import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const saveDataSchema = z.object({
  userId: z.string(),
  slotName: z.string(),
  saveData: z.object({
    playerData: z.object({
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      health: z.number(),
      maxHealth: z.number(),
      energy: z.number(),
      maxEnergy: z.number(),
      level: z.number(),
      experience: z.number(),
      abilities: z.array(z.string())
    }),
    gameData: z.object({
      currentArea: z.string(),
      completedQuests: z.array(z.string()),
      activeQuests: z.array(z.string()),
      questProgress: z.record(z.record(z.number())),
      gameTime: z.number()
    }),
    timestamp: z.number()
  })
});

export type SaveData = z.infer<typeof saveDataSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
