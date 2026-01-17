import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { ThemePurchaseService } from './theme-purchase.service';
import { PurchaseThemeDto } from './dto/purchase-theme.dto';
import { ThemeQueryDto } from './admin.dto';

@Controller('tenant-admin/themes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TenantAdmin')
export class ThemePurchaseController {
  constructor(private readonly themePurchaseService: ThemePurchaseService) {}

  @Get('available')
  async getAvailableThemes(@CurrentUser() user: JwtPayload) {
    if (!user.tenantId) throw new BadRequestException('Tenant ID missing from user token');
    return this.themePurchaseService.getAvailableThemesForTenant(user.tenantId);
  }

  @Post(':id/purchase')
  async purchaseTheme(
    @CurrentUser() user: JwtPayload,
    @Param('id') themeId: string,
    @Body() purchaseDto: PurchaseThemeDto,
  ) {
    const tenantId = user.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing from user token');
    
    // Set themeId from param if not in body
    purchaseDto.themeId = themeId;
    return this.themePurchaseService.purchaseTheme(tenantId, purchaseDto);
  }

  @Get('purchased')
  async getPurchasedThemes(@CurrentUser() user: JwtPayload) {
    if (!user.tenantId) throw new BadRequestException('Tenant ID missing from user token');
    return this.themePurchaseService.getTenantPurchasedThemes(user.tenantId);
  }

  @Get('check-access/:id')
  async checkAccess(@CurrentUser() user: JwtPayload, @Param('id') themeId: string) {
    if (!user.tenantId) throw new BadRequestException('Tenant ID missing from user token');
    const hasAccess = await this.themePurchaseService.checkThemeAccess(user.tenantId, themeId);
    return { hasAccess };
  }
}
