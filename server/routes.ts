import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssetSchema, updateAssetSchema } from "@shared/schema";
import { z } from "zod";
import { eventPublisher } from "./event-services";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize warehouse if not exists
  app.get("/api/warehouse/init", async (req, res) => {
    try {
      let warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        warehouseData = await storage.createWarehouse({
          name: "Main Warehouse",
          maxCapacity: 250,
          locationX: "50",
          locationY: "50",
          width: "100",
          height: "100",
        });
      }
      res.json(warehouseData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get warehouse info
  app.get("/api/warehouse", async (req, res) => {
    try {
      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouseData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all assets
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get assets in warehouse
  app.get("/api/assets/warehouse", async (req, res) => {
    try {
      const assets = await storage.getAssetsInWarehouse();
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get assets in field
  app.get("/api/assets/field", async (req, res) => {
    try {
      const assets = await storage.getAssetsInField();
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single asset
  app.get("/api/assets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Find asset by asset ID
  app.get("/api/assets/find/:assetId", async (req, res) => {
    try {
      const assetId = req.params.assetId;
      const asset = await storage.getAssetByAssetId(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Find asset by QR code
  app.get("/api/assets/qr/:qrCode", async (req, res) => {
    try {
      const qrCode = req.params.qrCode;
      const asset = await storage.getAssetByQrCode(qrCode);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new asset
  app.post("/api/assets", async (req, res) => {
    try {
      // Check warehouse capacity
      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(500).json({ message: "Warehouse not configured" });
      }

      if (req.body.inWarehouse && warehouseData.currentCount >= warehouseData.maxCapacity) {
        return res.status(400).json({ message: "Warehouse is at full capacity" });
      }

      const validatedData = insertAssetSchema.parse(req.body);
      
      // Generate unique asset ID
      const timestamp = Date.now();
      const prefix = validatedData.category.charAt(0).toUpperCase();
      const assetId = `${prefix}${timestamp.toString().slice(-6)}-2024`;
      
      const asset = await storage.createAsset({
        ...validatedData,
        assetId,
      });

      // Publish asset created event
      await eventPublisher.publishAssetEvent({
        id: `asset-${asset.id}-${Date.now()}`,
        action: 'created',
        assetId: asset.id.toString(),
        assetData: asset,
        timestamp: new Date()
      });

      // Send notification about asset creation
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'success',
        title: 'Nowy Asset Utworzony',
        message: `Asset ${asset.name} (${asset.assetId}) został pomyślnie utworzony w kategorii ${asset.category}`,
        timestamp: new Date(),
        metadata: { assetId: asset.id, action: 'created' }
      });

      res.status(201).json(asset);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update asset
  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // If moving to warehouse, check capacity
      if (req.body.inWarehouse === true) {
        const asset = await storage.getAsset(id);
        if (!asset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        if (!asset.inWarehouse) {
          const warehouseData = await storage.getWarehouse();
          if (warehouseData && warehouseData.currentCount >= warehouseData.maxCapacity) {
            return res.status(400).json({ message: "Warehouse is at full capacity" });
          }
        }
      }

      const validatedData = updateAssetSchema.parse(req.body);
      const asset = await storage.updateAsset(id, validatedData);
      
      // Publish asset updated event
      await eventPublisher.publishAssetEvent({
        id: `asset-${asset.id}-${Date.now()}`,
        action: 'updated',
        assetId: asset.id.toString(),
        assetData: asset,
        timestamp: new Date()
      });

      // Send notification about asset update
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'info',
        title: 'Asset Zaktualizowany',
        message: `Asset ${asset.name} (${asset.assetId}) został zaktualizowany`,
        timestamp: new Date(),
        metadata: { assetId: asset.id, action: 'updated' }
      });
      
      res.json(asset);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get asset details before deletion for the event
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      await storage.deleteAsset(id);
      
      // Publish asset deleted event
      await eventPublisher.publishAssetEvent({
        id: `asset-${id}-${Date.now()}`,
        action: 'deleted',
        assetId: id.toString(),
        assetData: asset,
        timestamp: new Date()
      });

      // Send notification about asset deletion
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'warning',
        title: 'Asset Usunięty',
        message: `Asset ${asset.name} (${asset.assetId}) został usunięty z systemu`,
        timestamp: new Date(),
        metadata: { assetId: id, action: 'deleted' }
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Move all assets randomly (Admin function)
  app.post("/api/admin/move-assets", async (req, res) => {
    try {
      const assets = await storage.moveAllAssetsRandomly();
      res.json({ message: "All assets moved randomly", assets });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allAssets = await storage.getAssets();
      const warehouseAssets = await storage.getAssetsInWarehouse();
      const fieldAssets = await storage.getAssetsInField();
      const warehouseData = await storage.getWarehouse();

      const stats = {
        totalAssets: allAssets.length,
        inWarehouse: warehouseAssets.length,
        inField: fieldAssets.length,
        freeSpace: warehouseData ? warehouseData.maxCapacity - warehouseData.currentCount : 0,
        warehouseCapacity: warehouseData?.maxCapacity || 0,
        capacityUsed: warehouseData ? Math.round((warehouseData.currentCount / warehouseData.maxCapacity) * 100) : 0,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Test notification endpoint (for debugging)
  app.post("/api/test/notification", async (req, res) => {
    try {
      const { type = 'info', title = 'Test Notification', message = 'To jest testowe powiadomienie' } = req.body;
      
      await eventPublisher.publishNotificationEvent({
        id: `test-notification-${Date.now()}`,
        type: type as 'success' | 'warning' | 'error' | 'info',
        title,
        message,
        timestamp: new Date(),
        metadata: { source: 'test-endpoint' }
      });
      
      res.json({ success: true, message: 'Powiadomienie testowe zostało wysłane' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
