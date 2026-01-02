import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users, type User, type LoginUser, type InsertUser } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: AuthenticatedUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'inventory-management-system'
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Register new user
   */
  static async register(userData: InsertUser): Promise<{ user: AuthenticatedUser; token: string }> {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Check if username already exists
    const existingUsername = await db.select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const [newUser] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, newUser.id));

    const authenticatedUser: AuthenticatedUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName || undefined,
      lastName: newUser.lastName || undefined,
    };

    const token = this.generateToken(authenticatedUser);

    return { user: authenticatedUser, token };
  }

  /**
   * Login user
   */
  static async login(loginData: LoginUser): Promise<{ user: AuthenticatedUser; token: string }> {
    // Find user by email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, loginData.email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isPasswordValid = await this.comparePassword(loginData.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

    const token = this.generateToken(authenticatedUser);

    return { user: authenticatedUser, token };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<AuthenticatedUser | null> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };
  }

  /**
   * Check if user has required role
   */
  static hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Check if user is admin
   */
  static isAdmin(userRole: string): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user is manager or admin
   */
  static isManagerOrAdmin(userRole: string): boolean {
    return ['admin', 'manager'].includes(userRole);
  }
}
