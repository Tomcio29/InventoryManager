import { 
  users, 
  assets, 
  warehouse,
  type User, 
  type InsertUser,
  type Asset,
  type InsertAsset,
  type UpdateAsset,
  type Warehouse,
  type InsertWarehouse
} from "@shared/schema";
import { db } from "./db";
import { eq, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Warehouse methods
  getWarehouse(): Promise<Warehouse | undefined>;
  createWarehouse(warehouseData: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, updates: Partial<Warehouse>): Promise<Warehouse>;
  
  // Asset methods
  getAssets(): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetByAssetId(assetId: string): Promise<Asset | undefined>;
  getAssetByQrCode(qrCode: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, updates: UpdateAsset): Promise<Asset>;
  deleteAsset(id: number): Promise<void>;
  getAssetsInWarehouse(): Promise<Asset[]>;
  getAssetsInField(): Promise<Asset[]>;
  moveAllAssetsRandomly(): Promise<Asset[]>;
  updateWarehouseCount(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getWarehouse(): Promise<Warehouse | undefined> {
    const [warehouseData] = await db.select().from(warehouse).limit(1);
    return warehouseData || undefined;
  }

  async createWarehouse(warehouseData: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db
      .insert(warehouse)
      .values(warehouseData)
      .returning();
    return newWarehouse;
  }

  async updateWarehouse(id: number, updates: Partial<Warehouse>): Promise<Warehouse> {
    const [updatedWarehouse] = await db
      .update(warehouse)
      .set(updates)
      .where(eq(warehouse.id, id))
      .returning();
    return updatedWarehouse;
  }

  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(assets.createdAt);
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async getAssetByAssetId(assetId: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId));
    return asset || undefined;
  }

  async getAssetByQrCode(qrCode: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.qrCode, qrCode));
    return asset || undefined;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    // Generate QR code content (asset ID)
    const qrCodeContent = asset.assetId;
    
    const [newAsset] = await db
      .insert(assets)
      .values({
        ...asset,
        qrCode: qrCodeContent,
        updatedAt: new Date(),
      })
      .returning();
    
    // Update warehouse count if asset is in warehouse
    if (newAsset.inWarehouse) {
      await this.updateWarehouseCount();
    }
    
    return newAsset;
  }

  async updateAsset(id: number, updates: UpdateAsset): Promise<Asset> {
    const originalAsset = await this.getAsset(id);
    if (!originalAsset) {
      throw new Error("Asset not found");
    }

    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    // Update warehouse count if warehouse status changed
    if (updates.inWarehouse !== undefined && updates.inWarehouse !== originalAsset.inWarehouse) {
      await this.updateWarehouseCount();
    }

    return updatedAsset;
  }

  async deleteAsset(id: number): Promise<void> {
    const asset = await this.getAsset(id);
    if (asset?.inWarehouse) {
      await db.delete(assets).where(eq(assets.id, id));
      await this.updateWarehouseCount();
    } else {
      await db.delete(assets).where(eq(assets.id, id));
    }
  }

  async getAssetsInWarehouse(): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.inWarehouse, true));
  }

  async getAssetsInField(): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.inWarehouse, false));
  }

  async moveAllAssetsRandomly(): Promise<Asset[]> {
    const allAssets = await this.getAssets();
    const updatedAssets: Asset[] = [];

    for (const asset of allAssets) {
      // Generate random coordinates within reasonable bounds
      const newX = Math.floor(Math.random() * 200) - 50; // -50 to 150
      const newY = Math.floor(Math.random() * 200) - 50; // -50 to 150
      
      // Randomly decide if asset should be in warehouse or field
      const inWarehouse = Math.random() > 0.5;
      const status = inWarehouse ? 'in_warehouse' : 'in_field';

      const updatedAsset = await this.updateAsset(asset.id, {
        locationX: newX.toString(),
        locationY: newY.toString(),
        inWarehouse,
        status,
      });

      updatedAssets.push(updatedAsset);
    }

    await this.updateWarehouseCount();
    return updatedAssets;
  }

  async updateWarehouseCount(): Promise<void> {
    const [result] = await db
      .select({ count: count() })
      .from(assets)
      .where(eq(assets.inWarehouse, true));

    const warehouseData = await this.getWarehouse();
    if (warehouseData) {
      await this.updateWarehouse(warehouseData.id, {
        currentCount: result.count,
      });
    }
  }
}

export const storage = new DatabaseStorage();
