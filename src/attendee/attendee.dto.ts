import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// Checkout DTOs
export class CheckoutItemDto {
  @IsNotEmpty()
  @IsUUID()
  ticket_type_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @IsNotEmpty()
  @IsUUID()
  event_id: string;

  @IsNotEmpty()
  @IsEmail()
  buyer_email: string;

  @IsNotEmpty()
  @IsString()
  buyer_name: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  discount_code?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['stripe', 'bkash', 'nagad', 'rocket'])
  payment_provider?: 'stripe' | 'bkash' | 'nagad' | 'rocket';
}

// Order response DTOs
export class OrderItemResponseDto {
  id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  unit_price_taka: number;
  quantity: number;
  subtotal_taka: number;
}

export class OrderResponseDto {
  id: string;
  event_id: string;
  event_name: string;
  buyer_email: string;
  buyer_name: string;
  total_taka: number;
  currency: string;
  status: string;
  payment_intent_id?: string;
  created_at: Date;
  items: OrderItemResponseDto[];
  tickets: TicketResponseDto[];
}

// Ticket response DTOs
export class TicketResponseDto {
  id: string;
  order_id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  attendee_name: string;
  attendee_email: string;
  qr_code_payload: string;
  status: string;
  checked_in_at?: Date;
  seat_label?: string;
}

// Event response DTOs (public-facing)
export class PublicEventResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  country: string;
  start_at: Date;
  end_at: Date;
  status: string;
  hero_image_url?: string | null;
  ticket_types: PublicTicketTypeResponseDto[];
  sessions?: PublicEventSessionResponseDto[];
}

export class PublicTicketTypeResponseDto {
  id: string;
  name: string;
  description: string;
  price_taka: number;
  currency: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_available: number;
  sales_start: Date;
  sales_end: Date;
  status: string;
}

export class PublicEventSessionResponseDto {
  id: string;
  title: string;
  description: string;
  start_at: Date;
  end_at: Date;
}

// Discount code validation DTO
export class ValidateDiscountCodeDto {
  @IsNotEmpty()
  @IsUUID()
  event_id: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}

export class DiscountCodeValidationResponseDto {
  valid: boolean;
  code?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  message?: string;
}

// Order lookup DTO
export class OrderLookupDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;
}

export class UpdateAttendeeProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
