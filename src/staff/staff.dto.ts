import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, number, and special character',
    },
  )
  password: string;

  @IsEnum(['CHECKER', 'SUPERVISOR', 'SUPPORT'])
  @IsNotEmpty()
  position: string;

  @IsOptional()
  @IsPhoneNumber('BD')
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsEnum(['CHECKER', 'SUPERVISOR', 'SUPPORT'])
  position?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password?: string;
}

export class CheckinDto {
  @IsString()
  @IsNotEmpty()
  qrPayload: string; // QR code payload or ticket ID
}

export class ReportIncidentDto {
  @IsEnum(['ISSUE', 'SECURITY', 'MEDICAL', 'LOST_ITEM'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  description: string;
}

export class ResolveIncidentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  resolutionNotes: string;

  @IsEnum(['FIXED', 'ESCALATED', 'DEFERRED'])
  @IsNotEmpty()
  resolutionType: string;
}
