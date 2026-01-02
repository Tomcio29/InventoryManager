import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin', 'manager', 'user'
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: text("user_id"),
  scanSource: text("scan_source"),
  location: text("location"),
});

export const reconReports = pgTable("recon_reports", {
  id: serial("id").primaryKey(),
  runAt: timestamp("run_at").defaultNow().notNull(),
  diff: text("diff"),
  status: text("status").notNull().default("new"),
});

export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  payload: text("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "user"]).default("user"),
}).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = insertUserSchema.omit({ password: true }).partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
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
export type LoginUser = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "admin" | "manager" | "user";

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouse.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;
export type Asset = typeof assets.$inferSelect;
