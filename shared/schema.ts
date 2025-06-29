import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const warehouse = pgTable("warehouse", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  maxCapacity: integer("max_capacity").notNull().default(250),
  currentCount: integer("current_count").notNull().default(0),
  locationX: decimal("location_x", { precision: 10, scale: 2 }).notNull().default("0"),
  locationY: decimal("location_y", { precision: 10, scale: 2 }).notNull().default("0"),
  width: decimal("width", { precision: 10, scale: 2 }).notNull().default("100"),
  height: decimal("height", { precision: 10, scale: 2 }).notNull().default("100"),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assetId: text("asset_id").notNull().unique(),
  category: text("category").notNull(),
  status: text("status").notNull().default("in_warehouse"), // 'in_warehouse', 'in_field', 'in_transit'
  locationX: decimal("location_x", { precision: 10, scale: 2 }).notNull(),
  locationY: decimal("location_y", { precision: 10, scale: 2 }).notNull(),
  inWarehouse: boolean("in_warehouse").notNull().default(true),
  qrCode: text("qr_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  type: text("type").notNull(), // 'email', 'push', 'sms', 'webhook', 'internal'
  channel: text("channel").notNull(), // 'success', 'warning', 'error', 'info'
  recipient: text("recipient").notNull(), // email, phone, user_id
  subject: text("subject"),
  message: text("message").notNull(),
  templateData: text("template_data"), // JSON string
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'failed', 'retry'
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouse).omit({
  id: true,
  currentCount: true,
});

export const updateWarehouseSchema = createInsertSchema(warehouse).omit({
  id: true,
  currentCount: true,
}).partial();

export const insertAssetSchema = createInsertSchema(assets, {
  locationX: z.union([z.string(), z.number()]).transform(String),
  locationY: z.union([z.string(), z.number()]).transform(String),
}).omit({
  id: true,
  assetId: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAssetSchema = createInsertSchema(assets, {
  locationX: z.union([z.string(), z.number()]).transform(String),
  locationY: z.union([z.string(), z.number()]).transform(String),
}).omit({
  id: true,
  assetId: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouse.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;
export type Asset = typeof assets.$inferSelect;
