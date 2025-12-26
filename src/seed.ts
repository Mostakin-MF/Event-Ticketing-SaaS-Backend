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
    `UPDATE "user_entity" SET "passwordHash" = $1 WHERE "email" = $2`,
    [specificHash, directEmail]
  );
  console.log(`Updated password hash for ${directEmail}`);

  await app.close();
}
bootstrap();
