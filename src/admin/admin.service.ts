import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  UpdateTenantUserStatusDto,
  CreateWebhookEventDto,
  UpdateWebhookEventDto,
  UpdateWebhookEventStatusDto,
  CreatePaymentDto,
  UpdatePaymentDto,
  UpdatePaymentStatusDto,
  CreateActivityLogDto,
  UserQueryDto,
  TenantQueryDto,
  TenantUserQueryDto,
  WebhookEventQueryDto,
  PaymentQueryDto,
  ActivityLogQueryDto,
  CreateThemeDto,
  UpdateThemeDto,
  ThemeQueryDto,
  UpdateTenantConfigDto,
} from './admin.dto';
import { UserEntity } from './user.entity';
import { TenantEntity } from './tenant.entity';
import { TenantUserEntity } from './tenant-user.entity';
import { WebhookEventEntity } from './webhook-event.entity';
import { PaymentEntity } from './payment.entity';
import { ActivityLogEntity } from './activity-log.entity';
import { ThemeEntity } from './theme.entity';
import { TenantConfigEntity } from './tenant-config.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantUserEntity)
    private tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(WebhookEventEntity)
    private webhookEventRepository: Repository<WebhookEventEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(ActivityLogEntity)
    private activityLogRepository: Repository<ActivityLogEntity>,
    @InjectRepository(ThemeEntity)
    private themeRepository: Repository<ThemeEntity>,
    @InjectRepository(TenantConfigEntity)
    private tenantConfigRepository: Repository<TenantConfigEntity>,
  ) { }

  async seedThemes() {
    const themes = [
      {
        name: 'Midnight Pro',
        description: 'Premium dark mode theme for concerts and nightlife.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
        isPremium: false,
        price: 0,
        type: 'dark',
        defaultProperties: {
          colors: {
            primary: '#10b981', // Emerald 500
            secondary: '#f59e0b', // Amber 500
            background: '#020617', // Slate 950
            text: '#ffffff'
          },
          fonts: { heading: 'Inter', body: 'Inter' },
          layout: 'hero-focus'
        }
      },
      {
        name: 'Sunset Festival',
        description: 'Warm and vibrant theme for outdoor festivals.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&q=80&w=500',
        isPremium: false,
        price: 0,
        type: 'light',
        defaultProperties: {
          colors: {
            primary: '#f97316', // Orange 500
            secondary: '#8b5cf6', // Violet 500
            background: '#fff7ed', // Orange 50
            text: '#1e1e2e'
          },
          fonts: { heading: 'Outfit', body: 'Roboto' },
          layout: 'grid'
        }
      },
      {
        name: 'Corporate Summit',
        description: 'Clean and professional look for business events.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1505373877841-8d43f703fb8f?auto=format&fit=crop&q=80&w=500',
        isPremium: true,
        price: 49.00,
        type: 'light',
        defaultProperties: {
          colors: {
            primary: '#2563eb', // Blue 600
            secondary: '#64748b', // Slate 500
            background: '#f8fafc', // Slate 50
            text: '#0f172a'
          },
          fonts: { heading: 'Inter', body: 'Inter' },
          layout: 'list'
        }
      }
    ];

    for (const themeData of themes) {
      const existing = await this.themeRepository.findOne({ where: { name: themeData.name } });
      if (!existing) {
        await this.themeRepository.save(this.themeRepository.create({
          ...themeData,
          status: 'active',
          properties: {} // Legacy support
        }));
      }
    }

    return { message: 'Themes seeded successfully' };
  }

  // User operations (Platform Users)
  async createUser(createUserDto: CreateUserDto, manager?: EntityManager): Promise<UserEntity> {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const repo = manager ? manager.getRepository(UserEntity) : this.userRepository;

    const user = repo.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      fullName: createUserDto.fullName,
      isPlatformAdmin: createUserDto.isPlatformAdmin ?? false,
    });


    try {
      return await repo.save(user);
    } catch (error: any) {
      if (error.code === '23505') { // Postgres unique violation code
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async registerAdmin(createAdminDto: any): Promise<UserEntity> {
    // Check if email already exists
    const existingUser = await this.findUserByEmail(createAdminDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Create Admin User
    return this.createUser({
      email: createAdminDto.email,
      password: createAdminDto.password,
      fullName: createAdminDto.fullName,
      isPlatformAdmin: true,
    });
  }

  async getAllUsers(query: UserQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    console.log('getAllUsers Query:', query);

    const whereCondition: any = {};
    if (query.isPlatformAdmin !== undefined) {
      // Handle potential string 'true'/'false' from query params
      const isAdmin = String(query.isPlatformAdmin) === 'true';
      whereCondition.isPlatformAdmin = isAdmin;
      console.log(`Filtering by isPlatformAdmin: ${isAdmin}`); // Debug log
    }

    let finalWhere: any = whereCondition;
    if (search) {
      finalWhere = [
        { ...whereCondition, email: Like(`%${search}%`) },
        { ...whereCondition, fullName: Like(`%${search}%`) }
      ];
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: finalWhere,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Users retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          search: search ?? null,
        },
      },
      data,
    };
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findActiveTenantUsersByUserId(
    userId: string,
  ): Promise<TenantUserEntity[]> {
    return this.tenantUserRepository.find({
      where: {
        userId,
        status: 'active',
      },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const updateData: Partial<UserEntity> = {};
    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.password !== undefined) {
      // Generate salt and hash new password
      const salt = await bcrypt.genSalt();
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
    }
    if (updateUserDto.fullName !== undefined) {
      updateData.fullName = updateUserDto.fullName;
    }
    if (updateUserDto.isPlatformAdmin !== undefined) {
      updateData.isPlatformAdmin = updateUserDto.isPlatformAdmin;
    }

    // Attendee profile fields should be handled via AttendeeService or AuthService directly updating AttendeeEntity
    // They are no longer part of UserEntity

    await this.userRepository.update(id, updateData);
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  // Tenant operations
  async createTenant(createTenantDto: CreateTenantDto): Promise<TenantEntity> {
    const tenant = this.tenantRepository.create({
      name: createTenantDto.name,
      slug: createTenantDto.slug,
      brandingSettings: createTenantDto.brandingSettings,
      status: createTenantDto.status ?? 'pending',
    });
    return this.tenantRepository.save(tenant);
  }

  async getAllTenants(query: TenantQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<TenantEntity> = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.tenantRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Tenants retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          search: search ?? null,
          status: status ?? null,
        },
      },
      data,
    };
  }

  async getTenantById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  async updateTenant(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantEntity> {
    await this.tenantRepository.update(id, updateTenantDto);
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  async updateTenantStatus(
    id: string,
    updateStatusDto: UpdateTenantStatusDto,
  ): Promise<TenantEntity> {
    await this.tenantRepository.update(id, { status: updateStatusDto.status });
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const result = await this.tenantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
  }

  // Tenant User operations
  async createTenantUser(
    createTenantUserDto: CreateTenantUserDto,
  ): Promise<TenantUserEntity> {
    const tenantUser = this.tenantUserRepository.create({
      tenantId: createTenantUserDto.tenantId,
      userId: createTenantUserDto.userId,
      role: createTenantUserDto.role,
      status: createTenantUserDto.status ?? 'active',
      invitedAt: new Date(),
    });
    return this.tenantUserRepository.save(tenantUser);
  }

  async getAllTenantUsers(query: TenantUserQueryDto) {
    const { page = 1, limit = 10, tenantId, userId, role, status, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tenantUserRepository.createQueryBuilder('tenantUser')
      .leftJoinAndSelect('tenantUser.tenant', 'tenant')
      .leftJoinAndSelect('tenantUser.user', 'user');

    if (tenantId) {
      queryBuilder.andWhere('tenantUser.tenantId = :tenantId', { tenantId });
    }
    if (userId) {
      queryBuilder.andWhere('tenantUser.userId = :userId', { userId });
    }
    if (role) {
      queryBuilder.andWhere('tenantUser.role = :role', { role });
    }
    if (status) {
      queryBuilder.andWhere('tenantUser.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.fullName LIKE :search OR tenant.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('tenantUser.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Tenant users retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          tenantId: tenantId ?? null,
          userId: userId ?? null,
          role: role ?? null,
          status: status ?? null,
        },
      },
      data,
    };
  }

  async getTenantUserById(id: string): Promise<TenantUserEntity> {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { id },
      relations: ['tenant', 'user'],
    });
    if (!tenantUser) {
      throw new NotFoundException(`Tenant user with id ${id} not found`);
    }
    return tenantUser;
  }

  async updateTenantUser(
    id: string,
    updateTenantUserDto: UpdateTenantUserDto,
  ): Promise<TenantUserEntity> {
    await this.tenantUserRepository.update(id, updateTenantUserDto);
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { id },
      relations: ['tenant', 'user'],
    });
    if (!tenantUser) {
      throw new NotFoundException(`Tenant user with id ${id} not found`);
    }
    return tenantUser;
  }

  async updateTenantUserStatus(
    id: string,
    updateStatusDto: UpdateTenantUserStatusDto,
  ): Promise<TenantUserEntity> {
    await this.tenantUserRepository.update(id, {
      status: updateStatusDto.status,
    });
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { id },
      relations: ['tenant', 'user'],
    });
    if (!tenantUser) {
      throw new NotFoundException(`Tenant user with id ${id} not found`);
    }
    return tenantUser;
  }

  async deleteTenantUser(id: string): Promise<void> {
    const result = await this.tenantUserRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tenant user with id ${id} not found`);
    }
  }

  // Webhook Event operations
  async createWebhookEvent(
    createWebhookEventDto: CreateWebhookEventDto,
  ): Promise<WebhookEventEntity> {
    const webhookEvent = this.webhookEventRepository.create({
      provider: createWebhookEventDto.provider,
      eventType: createWebhookEventDto.eventType,
      payload: createWebhookEventDto.payload,
      receivedAt: new Date(createWebhookEventDto.receivedAt),
      status: 'pending',
    });
    return this.webhookEventRepository.save(webhookEvent);
  }

  async getAllWebhookEvents(query: WebhookEventQueryDto) {
    const { page = 1, limit = 10, provider, eventType, status } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<WebhookEventEntity> = {};

    if (provider) {
      where.provider = provider;
    }
    if (eventType) {
      where.eventType = Like(`%${eventType}%`);
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.webhookEventRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { receivedAt: 'DESC' },
    });

    return {
      message: 'Webhook events retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          provider: provider ?? null,
          eventType: eventType ?? null,
          status: status ?? null,
        },
      },
      data,
    };
  }

  async getWebhookEventById(id: string): Promise<WebhookEventEntity> {
    const webhookEvent = await this.webhookEventRepository.findOneBy({ id });
    if (!webhookEvent) {
      throw new NotFoundException(`Webhook event with id ${id} not found`);
    }
    return webhookEvent;
  }

  async updateWebhookEvent(
    id: string,
    updateWebhookEventDto: UpdateWebhookEventDto,
  ): Promise<WebhookEventEntity> {
    const updateData: Partial<WebhookEventEntity> = {};
    if (updateWebhookEventDto.processedAt) {
      updateData.processedAt = new Date(updateWebhookEventDto.processedAt);
    }
    if (updateWebhookEventDto.status) {
      updateData.status = updateWebhookEventDto.status;
    }
    if (updateWebhookEventDto.errorMessage !== undefined) {
      updateData.errorMessage = updateWebhookEventDto.errorMessage;
    }

    await this.webhookEventRepository.update(id, updateData);
    const webhookEvent = await this.webhookEventRepository.findOneBy({ id });
    if (!webhookEvent) {
      throw new NotFoundException(`Webhook event with id ${id} not found`);
    }
    return webhookEvent;
  }

  async updateWebhookEventStatus(
    id: string,
    updateStatusDto: UpdateWebhookEventStatusDto,
  ): Promise<WebhookEventEntity> {
    const updateData: Partial<WebhookEventEntity> = {
      status: updateStatusDto.status,
      processedAt: new Date(),
    };
    if (updateStatusDto.errorMessage) {
      updateData.errorMessage = updateStatusDto.errorMessage;
    }

    await this.webhookEventRepository.update(id, updateData);
    const webhookEvent = await this.webhookEventRepository.findOneBy({ id });
    if (!webhookEvent) {
      throw new NotFoundException(`Webhook event with id ${id} not found`);
    }
    return webhookEvent;
  }

  async deleteWebhookEvent(id: string): Promise<void> {
    const result = await this.webhookEventRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Webhook event with id ${id} not found`);
    }
  }

  // Payment operations
  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentEntity> {
    const paymentData: Partial<PaymentEntity> = {
      orderId: createPaymentDto.orderId,
      provider: createPaymentDto.provider,
      providerReference: createPaymentDto.providerReference,
      status: createPaymentDto.status ?? 'pending',
      amountCents: createPaymentDto.amountCents,
      currency: createPaymentDto.currency ?? 'BDT', // Default to BDT (Bangladeshi Taka)
      payload: createPaymentDto.payload,
    };
    if (createPaymentDto.processedAt) {
      paymentData.processedAt = new Date(createPaymentDto.processedAt);
    }
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async getAllPayments(query: PaymentQueryDto) {
    const { page = 1, limit = 10, orderId, provider, status } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<PaymentEntity> = {};

    if (orderId) {
      where.orderId = orderId;
    }
    if (provider) {
      where.provider = provider;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Payments retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          orderId: orderId ?? null,
          provider: provider ?? null,
          status: status ?? null,
        },
      },
      data,
    };
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOneBy({ id });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async updatePayment(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentEntity> {
    const updateData: Partial<PaymentEntity> = {};
    if (updatePaymentDto.status) {
      updateData.status = updatePaymentDto.status;
    }
    if (updatePaymentDto.processedAt) {
      updateData.processedAt = new Date(updatePaymentDto.processedAt);
    }
    if (updatePaymentDto.payload) {
      updateData.payload = updatePaymentDto.payload;
    }

    await this.paymentRepository.update(id, updateData);
    const payment = await this.paymentRepository.findOneBy({ id });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async updatePaymentStatus(
    id: string,
    updateStatusDto: UpdatePaymentStatusDto,
  ): Promise<PaymentEntity> {
    await this.paymentRepository.update(id, {
      status: updateStatusDto.status,
      processedAt: new Date(),
    });
    const payment = await this.paymentRepository.findOneBy({ id });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async deletePayment(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
  }

  // Activity Log operations
  async createActivityLog(
    createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLogEntity> {
    const activityLog = this.activityLogRepository.create({
      tenantId: createActivityLogDto.tenantId,
      actorId: createActivityLogDto.actorId,
      action: createActivityLogDto.action,
      metadata: createActivityLogDto.metadata,
    });
    return this.activityLogRepository.save(activityLog);
  }

  async getAllActivityLogs(query: ActivityLogQueryDto) {
    const { page = 1, limit = 10, tenantId, actorId, action } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<ActivityLogEntity> = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }
    if (actorId) {
      where.actorId = actorId;
    }
    if (action) {
      where.action = Like(`%${action}%`);
    }

    const [data, total] = await this.activityLogRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['tenant', 'actor'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Activity logs retrieved successfully',
      meta: {
        page,
        limit,
        total,
        filters: {
          tenantId: tenantId ?? null,
          actorId: actorId ?? null,
          action: action ?? null,
        },
      },
      data,
    };
  }

  async getActivityLogById(id: string): Promise<ActivityLogEntity> {
    const activityLog = await this.activityLogRepository.findOne({
      where: { id },
      relations: ['tenant', 'actor'],
    });
    if (!activityLog) {
      throw new NotFoundException(`Activity log with id ${id} not found`);
    }
    return activityLog;
  }

  async deleteActivityLog(id: string): Promise<void> {
    const result = await this.activityLogRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Activity log with id ${id} not found`);
    }
  }
  async getStats() {
    const totalTenants = await this.tenantRepository.count({
      where: { status: 'active' },
    });
    const totalUsers = await this.userRepository.count();

    // Calculate total revenue from processed payments
    const { sum } = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amountCents)', 'sum')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const totalRevenue = sum ? parseInt(sum) / 100 : 0; // Convert cents to main currency unit

    // Calculate System Health based on payment success rate
    const totalPayments = await this.paymentRepository.count();
    const failedPayments = await this.paymentRepository.count({
      where: { status: 'failed' }
    });

    let healthStatus = 'Operational';
    if (totalPayments > 0) {
      const failureRate = failedPayments / totalPayments;
      if (failureRate > 0.1) { // More than 10% failure
        healthStatus = 'Degraded';
      }
    }

    return {
      activeTenants: totalTenants,
      totalUsers: totalUsers,
      totalRevenue: totalRevenue,
      systemHealth: healthStatus,
    };
  }

  // Theme operations
  async createTheme(createThemeDto: CreateThemeDto): Promise<ThemeEntity> {
    const theme = this.themeRepository.create(createThemeDto);
    return this.themeRepository.save(theme);
  }

  async getAllThemes(query: ThemeQueryDto): Promise<{ data: ThemeEntity[]; total: number }> {
    const qb = this.themeRepository.createQueryBuilder('theme');

    if (query.status) {
      qb.andWhere('theme.status = :status', { status: query.status });
    }

    if (query.category) {
      qb.andWhere('theme.category = :category', { category: query.category });
    }

    if (query.isPremium !== undefined) {
      qb.andWhere('theme.isPremium = :isPremium', { isPremium: query.isPremium });
    }

    if (query.search) {
      qb.andWhere('(theme.name ILIKE :search OR theme.description ILIKE :search)', { search: `%${query.search}%` });
    }

    qb.orderBy('theme.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getThemeById(id: string): Promise<ThemeEntity> {
    const theme = await this.themeRepository.findOneBy({ id });
    if (!theme) {
      throw new NotFoundException(`Theme with ID ${id} not found`);
    }
    return theme;
  }

  async updateTheme(id: string, updateThemeDto: UpdateThemeDto): Promise<ThemeEntity> {
    const theme = await this.getThemeById(id);
    Object.assign(theme, updateThemeDto);
    return this.themeRepository.save(theme);
  }

  async deleteTheme(id: string): Promise<void> {
    const result = await this.themeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Theme with ID ${id} not found`);
    }
  }

  async updateThemeStatus(id: string, status: string): Promise<ThemeEntity> {
    const theme = await this.getThemeById(id);
    theme.status = status;
    return this.themeRepository.save(theme);
  }

  async updateThemePrice(id: string, price: number, isPremium: boolean): Promise<ThemeEntity> {
    const theme = await this.getThemeById(id);
    theme.price = price;
    theme.isPremium = isPremium;
    return this.themeRepository.save(theme);
  }

  // Tenant Config Operations
  async getTenantConfig(tenantId: string): Promise<TenantConfigEntity> {
    const config = await this.tenantConfigRepository.findOne({
      where: { tenantId },
      relations: ['theme', 'tenant'], // Include theme and tenant details
    });

    if (!config) {
      // Create default config if none exists
      // But verify tenant exists first to avoid foreign key error
      const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
      if (!tenant) throw new NotFoundException('Tenant not found');

      const newConfig = this.tenantConfigRepository.create({ tenantId });
      return this.tenantConfigRepository.save(newConfig);
    }

    return config;
  }

  async updateTenantConfig(tenantId: string, updateDto: UpdateTenantConfigDto): Promise<TenantConfigEntity> {
    let config = await this.tenantConfigRepository.findOne({ where: { tenantId } });

    if (!config) {
      config = this.tenantConfigRepository.create({ tenantId });
    }

    Object.assign(config, updateDto);
    return this.tenantConfigRepository.save(config);
  }
}
