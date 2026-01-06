import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  Matches,
  MinLength,
  MaxLength,
  IsObject,
  IsBoolean,
  IsNumber,
  IsDateString,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// User DTOs (Platform Users)
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @IsBoolean()
  isPlatformAdmin?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  isPlatformAdmin?: boolean;
}

// Tenant DTOs
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsObject()
  brandingSettings?: Record<string, any>;

  @IsOptional()
  @IsIn(['active', 'suspended', 'pending'])
  status?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsObject()
  brandingSettings?: Record<string, any>;

  @IsOptional()
  @IsIn(['active', 'suspended', 'pending'])
  status?: string;
}

export class UpdateTenantStatusDto {
  @IsIn(['active', 'suspended', 'pending'], {
    message: 'status must be one of: active, suspended, pending',
  })
  status: string;
}

// Tenant User DTOs
export class CreateTenantUserDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsIn(['TenantAdmin', 'staff'], {
    message: 'role must be either TenantAdmin or staff',
  })
  role: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}

export class UpdateTenantUserDto {
  @IsOptional()
  @IsIn(['TenantAdmin', 'staff'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}

export class UpdateTenantUserStatusDto {
  @IsIn(['active', 'inactive', 'suspended'], {
    message: 'status must be one of: active, inactive, suspended',
  })
  status: string;
}

// Webhook Event DTOs
export class CreateWebhookEventDto {
  @IsIn(['stripe', 'bkash', 'nagad', 'rocket', 'mailer', 'other'], {
    message:
      'provider must be one of: stripe, bkash, nagad, rocket, mailer, other',
  })
  provider: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsDateString()
  @IsNotEmpty()
  receivedAt: string;
}

export class UpdateWebhookEventDto {
  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @IsOptional()
  @IsIn(['pending', 'processed', 'failed'])
  status?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class UpdateWebhookEventStatusDto {
  @IsIn(['pending', 'processed', 'failed'], {
    message: 'status must be one of: pending, processed, failed',
  })
  status: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

// Payment DTOs
export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsIn(['stripe', 'bkash', 'nagad', 'rocket', 'other'], {
    message: 'provider must be one of: stripe, bkash, nagad, rocket, other',
  })
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerReference: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'refunded'])
  status?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amountCents: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsIn(['BDT'], {
    message: 'currency must be BDT (Bangladeshi Taka)',
  })
  currency?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'refunded'])
  status?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class UpdatePaymentStatusDto {
  @IsIn(['pending', 'completed', 'failed', 'refunded'], {
    message: 'status must be one of: pending, completed, failed, refunded',
  })
  status: string;
}

// Activity Log DTOs
export class CreateActivityLogDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Query DTOs
export class UserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isPlatformAdmin?: string;
}

export class TenantQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'pending'])
  status?: string;
}

export class TenantUserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIn(['TenantAdmin', 'staff'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class WebhookEventQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(['stripe', 'bkash', 'nagad', 'rocket', 'mailer', 'other'])
  provider?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsIn(['pending', 'processed', 'failed'])
  status?: string;
}

export class PaymentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsIn(['stripe', 'bkash', 'nagad', 'rocket', 'other'])
  provider?: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'refunded'])
  status?: string;
}

export class ActivityLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
