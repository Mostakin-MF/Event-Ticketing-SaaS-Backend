import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AttendeeEntity } from '../attendee/attendee.entity';
import { RegisterAttendeeDto } from './register-attendee.dto';

export type UserRole = 'platform_admin' | 'TenantAdmin' | 'staff' | 'attendee' | null;

export interface JwtPayload {
  sub: string;
  email: string;
  isPlatformAdmin: boolean;
  role: UserRole;
  tenantId?: string;
  tenantRole?: 'TenantAdmin' | 'staff';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    @InjectRepository(AttendeeEntity)
    private attendeeRepository: Repository<AttendeeEntity>,
  ) { }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: any }> {
    // Find user by email
    const user = await this.adminService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password with bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Determine user role and tenant information
    let role: UserRole = null;
    let tenantId: string | undefined;
    let tenantRole: 'TenantAdmin' | 'staff' | undefined;

    // Check if user is platform admin
    if (user.isPlatformAdmin) {
      role = 'platform_admin';
    } else {
      // Check if user is an attendee (exists in attendees table)
      const attendee = await this.attendeeRepository.findOne({ where: { userId: user.id } });
      if (attendee) {
        role = 'attendee';
      }

      // Check for tenant roles (override or complement)
      const tenantUsers = await this.adminService.findActiveTenantUsersByUserId(
        user.id,
      );

      if (tenantUsers.length > 0) {
        // Use the first active tenant role (most recent by createdAt DESC)
        // Priority: TenantAdmin > staff
        const tenantAdmin = tenantUsers.find((tu) => tu.role === 'TenantAdmin');
        const activeTenantUser = tenantAdmin || tenantUsers[0];

        role = activeTenantUser.role as 'TenantAdmin' | 'staff';
        tenantId = activeTenantUser.tenantId;
        tenantRole = activeTenantUser.role as 'TenantAdmin' | 'staff';
      } else if (!role) {
        // If no platform admin, no tenant role, and NOT found in attendee table...
        // We could default to 'attendee' if we want to auto-create profiles on login, 
        // but strictly speaking they should have registered.
        // For now, if they have no role, they are denied.
      }
    }

    // Restriction: Ensure user has SOME valid role (Platform or Tenant)
    if (!role) {
      throw new UnauthorizedException('Access denied. No active role found.');
    }

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      role,
      ...(tenantId && { tenantId }),
      ...(tenantRole && { tenantRole }),
    };
    // Note: We are not updating the JwtPayload interface to keep it strict, 
    // BUT we will attach 'id' to the request object in the Strategy.
    // Actually, let's fix the Controller to use 'sub' or explicit casting.
    // However, existing controllers might rely on 'id'.
    // Better strategy: Ensure JwtStrategy maps 'sub' to 'id' in request.user OR Controller uses 'sub'.
    // Let's modify JwtStrategy or AuthService.
    // Wait, modifying AuthService payload won't help if the Interface doesn't have it and JwtStrategy doesn't map it.
    // The easiest fix for the immediate error "req.user.id" is changing Controller to use "req.user.sub".

    // Generate and return token
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: role,
        tenantId: tenantId,
        isPlatformAdmin: user.isPlatformAdmin
      }
    };
  }
  async register(registerDto: RegisterAttendeeDto): Promise<{ access_token: string; user: any }> {
    return this.dataSource.transaction(async (manager) => {
      // Check if user exists (using manager for consistency, though findUserByEmail in AdminService might not use manager, 
      // but here we are checking for uniqueness before creation. 
      // AdminService.createUser handles the unique constraint check as well, but we check here for early exit)

      // Note: We can't easily pass manager to findUserByEmail without refactoring that too, 
      // but for reading it's okay to use the default repo unless we are in higher isolation level.
      // For this implementation, we will trust the unique constraint in createUser or check first.

      let user = await this.adminService.findUserByEmail(registerDto.email);
      if (user) {
        throw new UnauthorizedException('User with this email already exists'); // Or ConflictException
      }

      // 1. Create User (Credentials only) via AdminService with transaction manager
      user = await this.adminService.createUser({
        email: registerDto.email,
        password: registerDto.password,
        fullName: registerDto.fullName,
        isPlatformAdmin: false
      }, manager);

      // 2. Create Attendee Profile using the same transaction manager
      const attendee = manager.create(AttendeeEntity, {
        userId: user.id,
        phoneNumber: registerDto.phoneNumber,
        dateOfBirth: registerDto.dateOfBirth,
        gender: registerDto.gender,
        country: registerDto.country,
        city: registerDto.city,
      });

      await manager.save(attendee);

      // We can't sign in within the transaction easily because signIn uses default repos, 
      // but after transaction commit, the user exists.
      // So we return the user and token AFTER the transaction block if we returned the user object.
      // However, to keep the signature, we can just return the result of signIn here, 
      // hoping signIn doesn't need to see the uncommitted data if it was just reading.
      // Actually, signIn reads the user. If we call it here, and the transaction isn't committed, 
      // the READ in signIn (which uses a separate connection) might NOT see the user yet!
      // FIX: We should generate the token manually or ensure signIn can see it.
      // OR: Return the user from the transaction, then call signIn outside.
      return user;
    }).then(async (user) => {
      // Transaction committed. Now valid to sign in.
      return this.signIn(user.email, registerDto.password);
    });
  }
}
