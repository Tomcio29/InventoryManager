import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssetSchema, updateAssetSchema } from "@shared/schema";
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { eventPublisher } from "./event-services";
import { determineAssetStatus } from "./warehouse-utils";
import { authRoutes } from "./auth-routes";
import { authenticateToken, requireAdmin, requireManager } from "./auth-middleware";
import { db } from './db';
import { reconReports, auditEvents, scans, users } from '@shared/schema';
import { AuthService } from './auth-service';
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register authentication routes
  app.use("/api/auth", authRoutes);

  // Test route for debugging
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test route works!" });
  });

  // Dev helper: return an admin JWT for local development (not for production)
  app.get('/api/dev/token', async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(404).end();
    try {
      const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
      if (!admin) return res.status(404).json({ error: 'No admin user found' });
      const token = AuthService.generateToken({ id: admin.id, username: admin.username, email: admin.email, role: admin.role });
      return res.json({ token });
    } catch (err) {
      console.error('Dev token error', err);
      return res.status(500).json({ error: 'Failed to generate dev token' });
    }
  });
  
  // Initialize warehouse if not exists
  app.get("/api/warehouse/init", async (req, res) => {
    try {
      let warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        warehouseData = await storage.createWarehouse({
          name: "Main Warehouse",
          maxCapacity: 250,
          locationX: "0",
          locationY: "0", 
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

  // Update warehouse configuration
  app.patch("/api/warehouse/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedWarehouse = await storage.updateWarehouse(id, updates);

      // Publish warehouse updated event
      await eventPublisher.publishWarehouseEvent({
        id: `warehouse-${updatedWarehouse.id}-${Date.now()}`,
        action: 'updated',
        warehouseId: updatedWarehouse.id.toString(),
        warehouseData: updatedWarehouse,
        timestamp: new Date()
      });

      // Send notification about warehouse update
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'info',
        title: 'Magazyn Zaktualizowany',
        message: `Konfiguracja magazynu "${updatedWarehouse.name}" została zaktualizowana`,
        timestamp: new Date(),
        metadata: { warehouseId: updatedWarehouse.id, action: 'updated' }
      });
      
      res.json(updatedWarehouse);
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

  // Record a scan for an asset (can be called by frontend QR scanner)
  app.post('/api/assets/:assetId/scan', async (req, res) => {
    const assetIdParam = req.params.assetId;
    const { userId, scanSource, location } = req.body || {};

    try {
      // support numeric id or assetId string
      let asset = null;
      if (/^\d+$/.test(assetIdParam)) {
        asset = await storage.getAsset(parseInt(assetIdParam));
      }
      if (!asset) {
        asset = await storage.getAssetByAssetId(assetIdParam);
      }
      if (!asset) return res.status(404).json({ error: 'Asset not found' });

      const scan = await storage.createScan(asset.id, { userId: userId || null, scanSource: scanSource || null, location: location || null });
      return res.json({ scan });
    } catch (err) {
      console.error('Error recording scan', err);
      return res.status(500).json({ error: 'Failed to record scan' });
    }
  });

  // List scans for an asset
  app.get('/api/assets/:assetId/scans', async (req, res) => {
    const assetIdParam = req.params.assetId;
    try {
      let asset = null;
      if (/^\d+$/.test(assetIdParam)) {
        asset = await storage.getAsset(parseInt(assetIdParam));
      }
      if (!asset) {
        asset = await storage.getAssetByAssetId(assetIdParam);
      }
      if (!asset) return res.status(404).json({ error: 'Asset not found' });

      const rows = await db.select().from(scans).where(eq(scans.assetId, asset.id)).orderBy(scans.timestamp.desc).limit(200);
      return res.json({ scans: rows });
    } catch (err) {
      console.error('Error listing scans', err);
      return res.status(500).json({ error: 'Failed to list scans' });
    }
  });

  // Create new asset
  app.post("/api/assets", authenticateToken, requireManager, async (req, res) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      
      // Generate unique asset ID
      const timestamp = Date.now();
      const prefix = validatedData.category.charAt(0).toUpperCase();
      const assetId = `${prefix}${timestamp.toString().slice(-6)}-2024`;
      
      // createAsset will automatically determine status based on coordinates
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
        message: `Asset ${asset.name} (${asset.assetId}) został pomyślnie utworzony w kategorii ${asset.category} - ${asset.inWarehouse ? 'w magazynie' : 'na terenie'}`,
        timestamp: new Date(),
        metadata: { assetId: asset.id, action: 'created', location: asset.inWarehouse ? 'warehouse' : 'field' }
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
  app.patch("/api/assets/:id", authenticateToken, requireManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(500).json({ message: "Warehouse not configured" });
      }

      const validatedData = updateAssetSchema.parse(req.body);
      
      // Check warehouse capacity if coordinates suggest asset is moving to warehouse
      if (validatedData.locationX !== undefined || validatedData.locationY !== undefined) {
        const newX = validatedData.locationX || asset.locationX;
        const newY = validatedData.locationY || asset.locationY;
        
        const { inWarehouse } = determineAssetStatus(newX, newY, warehouseData);
        
        if (inWarehouse && !asset.inWarehouse && warehouseData.currentCount >= warehouseData.maxCapacity) {
          return res.status(400).json({ message: "Warehouse is at full capacity" });
        }
      }

      // storage.updateAsset will automatically determine status based on coordinates
      const updatedAsset = await storage.updateAsset(id, validatedData);
      
      // Publish asset updated event
      await eventPublisher.publishAssetEvent({
        id: `asset-${updatedAsset.id}-${Date.now()}`,
        action: 'updated',
        assetId: updatedAsset.id.toString(),
        assetData: updatedAsset,
        timestamp: new Date()
      });

      // Send notification about asset update
      const locationInfo = updatedAsset.inWarehouse !== asset.inWarehouse 
        ? ` - ${updatedAsset.inWarehouse ? 'przeniesiony do magazynu' : 'przeniesiony na teren'}`
        : '';
        
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'info',
        title: 'Asset Zaktualizowany',
        message: `Asset ${updatedAsset.name} (${updatedAsset.assetId}) został zaktualizowany${locationInfo}`,
        timestamp: new Date(),
        metadata: { assetId: updatedAsset.id, action: 'updated', location: updatedAsset.inWarehouse ? 'warehouse' : 'field' }
      });
      
      res.json(updatedAsset);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id", authenticateToken, requireManager, async (req, res) => {
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
  app.post("/api/admin/move-assets", authenticateToken, requireAdmin, async (req, res) => {
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

  // Test warehouse update event endpoint (for debugging)
  app.post("/api/test/warehouse-update", async (req, res) => {
    try {
      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(404).json({ message: "Warehouse not found" });
      }

      // Publish warehouse updated event
      await eventPublisher.publishWarehouseEvent({
        id: `test-warehouse-${warehouseData.id}-${Date.now()}`,
        action: 'updated',
        warehouseId: warehouseData.id.toString(),
        warehouseData: warehouseData,
        timestamp: new Date()
      });

      // Send notification about warehouse update
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'info',
        title: 'Test Warehouse Update',
        message: `Testowe zdarzenie warehouse.updated dla magazynu "${warehouseData.name}"`,
        timestamp: new Date(),
        metadata: { warehouseId: warehouseData.id, action: 'test-updated', source: 'test-endpoint' }
      });
      
      res.json({ 
        success: true, 
        message: 'Testowe zdarzenie warehouse.updated zostało wysłane',
        warehouseData 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Fix asset statuses based on warehouse bounds
  app.post("/api/admin/fix-asset-statuses", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(500).json({ message: "Warehouse not configured" });
      }

      const assets = await storage.getAssets();
      let fixedCount = 0;
      const results = [];

      for (const asset of assets) {
        const { inWarehouse, status } = determineAssetStatus(
          asset.locationX, 
          asset.locationY, 
          warehouseData
        );

        // Check if status needs updating
        const needsUpdate = asset.inWarehouse !== inWarehouse || asset.status !== status;
        
        if (needsUpdate) {
          const updatedAsset = await storage.updateAsset(asset.id, {
            inWarehouse,
            status,
          });
          
          results.push({
            id: asset.id,
            name: asset.name,
            location: `(${asset.locationX}, ${asset.locationY})`,
            oldStatus: asset.inWarehouse ? 'warehouse' : 'field',
            newStatus: inWarehouse ? 'warehouse' : 'field',
            fixed: true
          });
          
          fixedCount++;
        } else {
          results.push({
            id: asset.id,
            name: asset.name,
            location: `(${asset.locationX}, ${asset.locationY})`,
            status: inWarehouse ? 'warehouse' : 'field',
            fixed: false
          });
        }
      }

      // Send notification about the fix
      await eventPublisher.publishNotificationEvent({
        id: `notification-${Date.now()}`,
        type: 'info',
        title: 'Statusy Assetów Naprawione',
        message: `Naprawiono statusy ${fixedCount} assetów na podstawie ich lokalizacji względem magazynu`,
        timestamp: new Date(),
        metadata: { action: 'fix-statuses', fixedCount, totalAssets: assets.length }
      });

      res.json({
        message: `Fixed ${fixedCount} asset statuses`,
        fixedCount,
        totalAssets: assets.length,
        results
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: run reconciliation with optional expected list in request body
  app.post("/api/admin/reconciliation/run", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // expected: array of objects with assetId or serial
      const expected: Array<any> = req.body?.expected || null;

      const current = await storage.getAssets();

      const expectedMap = new Map<string, any>();
      if (expected) for (const e of expected) {
        const key = e.assetId || e.serial;
        if (key) expectedMap.set(String(key), e);
      }

      const currentMap = new Map<string, any>();
      for (const c of current) currentMap.set(String(c.assetId || c.serial || c.id), c);

      const diffs: any[] = [];
      if (expected) {
        for (const [k, e] of expectedMap.entries()) if (!currentMap.has(k)) diffs.push({ type: 'missing_in_db', key: k, expected: e });
        for (const [k, c] of currentMap.entries()) if (!expectedMap.has(k)) diffs.push({ type: 'unexpected_in_db', key: k, current: c });
      }

      const report = { runAt: new Date(), diff: JSON.stringify(diffs), status: diffs.length ? 'anomalies' : 'ok' };
      const [r] = await db.insert(reconReports).values({ runAt: report.runAt, diff: report.diff, status: report.status }).returning();

      for (const d of diffs) await db.insert(auditEvents).values({ eventType: 'recon_diff', payload: JSON.stringify(d) });

      res.json({ success: true, report: r, diffsCount: diffs.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: list reconciliation reports
  app.get('/api/admin/recon-reports', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const reports = await db.select().from(reconReports).limit(100);
      // sort latest-first in JS to avoid driver-specific ORDER BY generation issues
      reports.sort((a: any, b: any) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime());
      res.json(reports);
    } catch (error: any) {
      console.error('Error fetching recon reports', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: list audit events
  app.get('/api/admin/audit-events', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const events = await db.select().from(auditEvents).limit(500);
      // sort latest-first by createdAt
      events.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(events);
    } catch (error: any) {
      console.error('Error fetching audit events', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Test status logic endpoint
  app.get("/api/test/status/:x/:y", async (req, res) => {
    try {
      const x = parseFloat(req.params.x);
      const y = parseFloat(req.params.y);
      
      const warehouseData = await storage.getWarehouse();
      if (!warehouseData) {
        return res.status(500).json({ message: "Warehouse not configured" });
      }

      const { inWarehouse, status } = determineAssetStatus(x, y, warehouseData);
      
      res.json({
        coordinates: { x, y },
        warehouse: {
          x: parseFloat(warehouseData.locationX),
          y: parseFloat(warehouseData.locationY),
          width: parseFloat(warehouseData.width),
          height: parseFloat(warehouseData.height),
          maxX: parseFloat(warehouseData.locationX) + parseFloat(warehouseData.width),
          maxY: parseFloat(warehouseData.locationY) + parseFloat(warehouseData.height)
        },
        result: { inWarehouse, status }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
