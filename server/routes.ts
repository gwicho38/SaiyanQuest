import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { z } from "zod";
import { saveDataSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sync endpoints
  app.post("/api/save", async (req, res) => {
    try {
      const { userId, slotName, saveData } = saveDataSchema.parse(req.body);
      await storage.saveGameData(userId, slotName, saveData);
      res.json({ success: true });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save game data" });
    }
  });

  app.get("/api/save/:userId/:slotName", async (req, res) => {
    try {
      const { userId, slotName } = req.params;
      const data = await storage.getGameData(userId, slotName);
      res.json({ success: true, data });
    } catch (error) {
      console.error("Load error:", error);
      res.status(404).json({ error: "Save data not found" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
