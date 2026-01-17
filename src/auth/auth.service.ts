import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export type UserRole = 'platform_admin' | 'TenantAdmin' | 'staff' | null;

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
  ) {}

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

    // Fetch active tenant roles for the user (even if they are a platform admin)
    const tenantUsers = await this.adminService.findActiveTenantUsersByUserId(
      user.id,
    );

    if (tenantUsers.length > 0) {
      // Use the first active tenant role (most recent by createdAt DESC)
      // Priority: TenantAdmin > staff
      const tenantAdmin = tenantUsers.find((tu) => tu.role === 'TenantAdmin');
      const activeTenantUser = tenantAdmin || tenantUsers[0];

      tenantId = activeTenantUser.tenantId;
      tenantRole = activeTenantUser.role as 'TenantAdmin' | 'staff';
      role = activeTenantUser.role as 'TenantAdmin' | 'staff';
    }

    // Platform admin status overrides the role for permissions, but we keep tenant context
    if (user.isPlatformAdmin) {
      role = 'platform_admin';
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

  async updateProfile(userId: string, data: any) {
    return this.adminService.updateUser(userId, data);
  }

  async getUserById(userId: string) {
    return this.adminService.getUserById(userId);
  }
}
