import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { AuthService } from './auth-service';

/**
 * Create default admin user if it doesn't exist
 */
export async function createDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const defaultAdmin = {
      username: 'admin',
      email: 'admin@inventory.local',
      password: 'admin123', // In production, this should be randomly generated and logged
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin' as const,
    };

    const result = await AuthService.register(defaultAdmin);
    
    console.log('✅ Default admin user created successfully:');
    console.log(`   Username: ${defaultAdmin.username}`);
    console.log(`   Email: ${defaultAdmin.email}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log('   ⚠️  Please change the password after first login!');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to create default admin user:', error);
    throw error;
  }
}

/**
 * Create demo users for testing
 */
export async function createDemoUsers() {
  try {
    // Check if demo users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 1) {
      console.log('✅ Demo users already exist');
      return;
    }

    const demoUsers = [
      {
        username: 'manager1',
        email: 'manager@inventory.local',
        password: 'manager123',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager' as const,
      },
      {
        username: 'user1',
        email: 'user@inventory.local',
        password: 'user123',
        firstName: 'Jane',
        lastName: 'User',
        role: 'user' as const,
      },
    ];

    console.log('📝 Creating demo users...');
    
    for (const userData of demoUsers) {
      try {
        await AuthService.register(userData);
        console.log(`   ✅ Created user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.log(`   ⚠️  User ${userData.username} already exists or failed to create`);
      }
    }

    console.log('✅ Demo users creation completed');
  } catch (error) {
    console.error('❌ Failed to create demo users:', error);
    throw error;
  }
}

/**
 * Initialize user system
 */
export async function initializeUserSystem() {
  console.log('🔐 Initializing user authentication system...');
  
  try {
    await createDefaultAdmin();
    await createDemoUsers();
    console.log('✅ User system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize user system:', error);
    throw error;
  }
}
