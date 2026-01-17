import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemePurchaseEntity } from './theme-purchase.entity';
import { ThemeEntity } from './theme.entity';
import { TenantEntity } from './tenant.entity';
import { PaymentEntity } from './payment.entity';
import { PurchaseThemeDto } from './dto/purchase-theme.dto';
import * as crypto from 'crypto';

@Injectable()
export class ThemePurchaseService {
  constructor(
    @InjectRepository(ThemePurchaseEntity)
    private themePurchaseRepository: Repository<ThemePurchaseEntity>,
    @InjectRepository(ThemeEntity)
    private themeRepository: Repository<ThemeEntity>,
    @InjectRepository(TenantEntity)
    private tenantRepository: Repository<TenantEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Purchase a premium theme
   */
  async purchaseTheme(tenantId: string, purchaseDto: PurchaseThemeDto): Promise<ThemePurchaseEntity> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    if (!purchaseDto.themeId) {
      throw new BadRequestException('Theme ID is required');
    }

    // 1. Verify theme exists and is premium
    const theme = await this.themeRepository.findOne({ where: { id: purchaseDto.themeId } });
    if (!theme) {
      throw new NotFoundException(`Theme with ID ${purchaseDto.themeId} not found`);
    }

    if (!theme.isPremium) {
      throw new BadRequestException('This theme is free and does not require purchase');
    }

    if (theme.status !== 'active') {
      throw new BadRequestException('This theme is not available for purchase');
    }

    // 2. Check if tenant already owns this theme
    const existingPurchase = await this.themePurchaseRepository.findOne({
      where: {
        tenantId,
        themeId: purchaseDto.themeId,
        status: 'active',
      },
    });

    if (existingPurchase) {
      throw new BadRequestException('You already own this theme');
    }

    // 3. Verify tenant exists
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // 4. Create payment record (simplified - in production, integrate with payment gateway)
    let savedPaymentId: string | undefined;

    if (purchaseDto.paymentMethod !== 'demo') {
      const allowedProviders = ['stripe', 'bkash', 'nagad', 'rocket', 'other'];
      const provider = allowedProviders.includes(purchaseDto.paymentMethod) 
        ? purchaseDto.paymentMethod 
        : 'other';

      try {
        // Safe UUID generation
        const orderId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const payment = this.paymentRepository.create({
          orderId: orderId,
          provider: provider as any,
          providerReference: provider === 'other' ? `${purchaseDto.paymentMethod}-${Date.now()}` : `ref-${Date.now()}`,
          status: 'completed', 
          amountCents: Math.round(Number(theme.price || 0) * 100),
          currency: 'BDT',
          payload: {
            type: 'theme_purchase',
            themeId: theme.id,
            themeName: theme.name,
            tenantId,
            actualPaymentMethod: purchaseDto.paymentMethod,
          },
        });
        const savedPayment = await this.paymentRepository.save(payment);
        savedPaymentId = savedPayment.id;
      } catch (paymentErr) {
        console.error('Payment record creation failed:', paymentErr);
        if (process.env.NODE_ENV === 'production') {
           throw new BadRequestException('Payment processing failed. Please try a different method.');
        }
      }
    }

    // 5. Create theme purchase record
    const pricePaid = Number(theme.price) || 0;
    const purchase = this.themePurchaseRepository.create({
      tenantId,
      themeId: theme.id,
      pricePaid: pricePaid,
      paymentId: savedPaymentId,
      status: 'active',
    });

    return this.themePurchaseRepository.save(purchase);
  }

  /**
   * Get all themes purchased by a tenant
   */
  async getTenantPurchasedThemes(tenantId: string): Promise<ThemePurchaseEntity[]> {
    return this.themePurchaseRepository.find({
      where: { tenantId, status: 'active' },
      relations: ['theme'],
      order: { purchasedAt: 'DESC' },
    });
  }

  /**
   * Get all available themes for a tenant (free + purchased premium)
   */
  async getAvailableThemesForTenant(tenantId: string): Promise<ThemeEntity[]> {
    // Return all active themes (both free and premium) derived from simple availability
    // The frontend handles showing which ones are purchased vs not
    return this.themeRepository.find({
      where: { status: 'active' },
      order: { isPremium: 'ASC', price: 'ASC' }
    });
  }

  /**
   * Check if tenant has access to a specific theme
   */
  async checkThemeAccess(tenantId: string, themeId: string): Promise<boolean> {
    const theme = await this.themeRepository.findOne({ where: { id: themeId } });
    
    if (!theme || theme.status !== 'active') {
      return false;
    }

    // Free themes are accessible to everyone
    if (!theme.isPremium) {
      return true;
    }

    // Check if tenant purchased this premium theme
    const purchase = await this.themePurchaseRepository.findOne({
      where: {
        tenantId,
        themeId,
        status: 'active',
      },
    });

    return !!purchase;
  }

  /**
   * Get purchase details
   */
  async getPurchaseById(purchaseId: string): Promise<ThemePurchaseEntity> {
    const purchase = await this.themePurchaseRepository.findOne({
      where: { id: purchaseId },
      relations: ['theme', 'tenant', 'payment'],
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  /**
   * Cancel/refund a purchase (admin only)
   */
  async cancelPurchase(purchaseId: string): Promise<ThemePurchaseEntity> {
    const purchase = await this.getPurchaseById(purchaseId);
    
    purchase.status = 'cancelled';
    return this.themePurchaseRepository.save(purchase);
  }

  /**
   * Get all purchases (admin view)
   */
  async getAllPurchases(filters?: { tenantId?: string; themeId?: string; status?: string }): Promise<ThemePurchaseEntity[]> {
    const where: any = {};
    
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.themeId) where.themeId = filters.themeId;
    if (filters?.status) where.status = filters.status;

    return this.themePurchaseRepository.find({
      where,
      relations: ['theme', 'tenant', 'payment'],
      order: { purchasedAt: 'DESC' },
    });
  }
}
