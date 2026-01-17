import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  const email = 'admin@example.com';
  const password = 'password';

  // Ensure default admin exists
  let user = await adminService.findUserByEmail(email);
  if (!user) {
    console.log(`Creating default admin user: ${email}`);
    await adminService.createUser({
      email,
      password,
      fullName: 'Super Admin',
      isPlatformAdmin: true,
    });
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }

  // Create/Update user with SPECIFIC HASH provided by user
  const directEmail = 'admin@platform.com';
  const specificHash = '$2b$10$f9DPIIp2n.jKFToES3EALeds3yVewJgm9EbTpoIo2aXeXXdAxCxg6';
  
  // We use the repository directly via module reference or just raw query if needed.
  // Since we are in standalone script, getting repo is verbose.
  // Easiest is to use the service to create a dummy user, then update the hash manually.
  
  let platformUser = await adminService.findUserByEmail(directEmail);
  if (!platformUser) {
    console.log(`Creating platform admin user: ${directEmail}`);
    platformUser = await adminService.createUser({
      email: directEmail,
      password: 'temporaryPassword123', // Will be overwritten
      fullName: 'Platform Admin',
      isPlatformAdmin: true,
    });
  }

  // FORCE UPDATE the password hash
  // We need to access the repository safely. 
  // AdminService has private repository. 
  // Let's use QueryRunner or just SQL via DataSource?
  // We can get DataSource from app.
  const dataSource = app.get(DataSource);
  await dataSource.query(
    `UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2`,
    [specificHash, directEmail]
  );
  console.log(`Updated password hash for ${directEmail}`);

  // Delete all existing themes first
  console.log('Removing old themes...');
  // First, remove theme references from tenant_configs
  await dataSource.query(`UPDATE tenant_configs SET "themeId" = NULL WHERE "themeId" IS NOT NULL`);
  // Also remove from tenants table if it exists
  await dataSource.query(`UPDATE tenants SET "themeId" = NULL WHERE "themeId" IS NOT NULL`);
  // Now we can safely delete themes
  await dataSource.query(`DELETE FROM themes`);
  console.log('Old themes removed.');

  // Seed Themes
  console.log('Seeding themes...');
  
  const themes = [
    {
      name: 'Modern Dark',
      description: 'Perfect for concerts, nightlife events, and DJ performances. Features dark backgrounds with neon accents and glassmorphism effects.',
      isPremium: false,
      price: 0,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470229722913-7ea9959fa270?w=800&h=600&fit=crop&auto=format',
      defaultProperties: {
        colors: {
          primary: '#10b981',
          secondary: '#f59e0b',
          background: '#020617',
          text: '#ffffff',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'hero-focus',
      },
    },
    {
      name: 'Vibrant Festival',
      description: 'Ideal for music festivals, cultural events, and outdoor gatherings. Bright, colorful design with playful animations.',
      isPremium: false,
      price: 0,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop&auto=format',
      defaultProperties: {
        colors: {
          primary: '#f97316',
          secondary: '#8b5cf6',
          background: '#fff7ed',
          text: '#1e1e2e',
        },
        fonts: {
          heading: 'Outfit',
          body: 'Roboto',
        },
        layout: 'grid',
      },
    },
    {
      name: 'Professional Corporate',
      description: 'Designed for conferences, seminars, and business networking events. Clean, minimal, and professional.',
      isPremium: true,
      price: 49.99,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&auto=format',
      defaultProperties: {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          background: '#f8fafc',
          text: '#0f172a',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'list',
      },
    },
  ];

  // Insert all themes (we already deleted old ones)
  for (const themeData of themes) {
    await dataSource.query(
      `INSERT INTO themes (name, description, "isPremium", price, status, "thumbnailUrl", "defaultProperties", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        themeData.name,
        themeData.description,
        themeData.isPremium,
        themeData.price,
        themeData.status,
        themeData.thumbnailUrl,
        JSON.stringify(themeData.defaultProperties),
      ]
    );
    console.log(`Created theme: ${themeData.name}`);
  }

  console.log('Theme seeding completed!');

  await app.close();
}
bootstrap();
