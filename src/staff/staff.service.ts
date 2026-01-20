import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

import { StaffEntity } from './staff.entity';
import { IncidentEntity } from './incident.entity';
import { ActivityLogEntity } from '../admin/activity-log.entity';
import { CreateStaffDto, UpdateStaffDto, CheckinDto, ReportIncidentDto, ResolveIncidentDto } from './staff.dto';

import {
  Event,
  TicketType,
  Order,
  Ticket,
} from '../tenant-admin/tenant-entity';
import { UserEntity } from '../admin/user.entity';
import { TenantUserEntity } from '../admin/tenant-user.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly staffRepo: Repository<StaffEntity>,

    @InjectRepository(IncidentEntity)
    private readonly incidentRepo: Repository<IncidentEntity>,

    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepo: Repository<ActivityLogEntity>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    @InjectRepository(TicketType)
    private readonly ticketTypeRepo: Repository<TicketType>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepo: Repository<TenantUserEntity>,

    private readonly mailerService: MailerService,
  ) { }

  /**
   * =====================================================
   * STAFF MANAGEMENT METHODS
   * =====================================================
   */

  /**
   * Helper method to sync TenantUserEntity status with StaffEntity.isActive
   * Ensures data consistency between the two entities
   */
  private async syncTenantUserStatus(
    tenantId: string,
    userId: string,
    isActive: boolean,
  ): Promise<void> {
    const status = isActive ? 'active' : 'inactive';
    await this.tenantUserRepo.update({ tenantId, userId }, { status });
  }

  /**
   * Create a new staff member for a tenant.
   * Called from: POST /staff/register
   *
   * This method:
   * 1. Creates a UserEntity with email and password
   * 2. Creates a StaffEntity linked to that user
   * 3. Creates a TenantUserEntity entry for authentication (role='staff')
   */
  async registerStaff(
    tenantId: string,
    dto: CreateStaffDto,
  ): Promise<StaffEntity> {
    // Step 1: Check if user with this email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    let userId: string;

    if (existingUser) {
      // User exists, check if they're already staff for this tenant
      const existingStaff = await this.staffRepo.findOne({
        where: { tenantId, userId: existingUser.id },
      });

      if (existingStaff) {
        throw new ConflictException(
          `Staff with email ${dto.email} already exists in this tenant`,
        );
      }

      // User exists but not as staff for this tenant, use existing user
      userId = existingUser.id;
    } else {
      // Step 2: Create new UserEntity
      const passwordHash = await bcrypt.hash(dto.password, 10);

      const newUser = this.userRepo.create({
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName,
        isPlatformAdmin: false,
      });

      const savedUser = await this.userRepo.save(newUser);
      userId = savedUser.id;
    }

    // Step 3: Create StaffEntity linked to the user
    const staff = this.staffRepo.create({
      tenantId,
      userId,
      fullName: dto.fullName,
      position: dto.position,
      phoneNumber: dto.phoneNumber ?? null,
      gender: dto.gender ?? null,
      isActive: true,
    });

    const savedStaff = await this.staffRepo.save(staff);

    // Step 4: Create TenantUserEntity entry for authentication (role='staff')
    // This allows the user to authenticate and get the 'staff' role for this tenant
    const existingTenantUser = await this.tenantUserRepo.findOne({
      where: { tenantId, userId },
    });

    if (!existingTenantUser) {
      const tenantUser = this.tenantUserRepo.create({
        tenantId,
        userId,
        role: 'staff',
        status: 'active',
        invitedAt: new Date(),
      });

      await this.tenantUserRepo.save(tenantUser);
    } else if (existingTenantUser.role !== 'staff') {
      // Update role if it's different
      existingTenantUser.role = 'staff';
      existingTenantUser.status = 'active';
      await this.tenantUserRepo.save(existingTenantUser);
    }

    // Send welcome email
    try {
      await this.mailerService.sendMail({
        to: dto.email,
        subject: 'Welcome to Event Ticketing System - Staff Account Created',
        text: `Hello ${dto.fullName},\n\nYour staff account has been created successfully.\n\nYou can now login with:\nEmail: ${dto.email}\n\nPlease ensure you keep your password secure.\n\nBest regards,\nEvent Ticketing Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome!</h2>
            <p>Hello ${dto.fullName},</p>
            <p>Your staff account has been created successfully.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">You can now login with:</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${dto.email}</p>
            </div>
            <p><strong>Important:</strong> Please ensure you keep your password secure.</p>
            <p>Best regards,<br>Event Ticketing Team</p>
          </div>
        `,
      });
    } catch (error) {
      // Log error but don't fail the registration
      console.error('Failed to send welcome email:', error);
    }

    return savedStaff;
  }

  /**
   * Get currently logged-in staff profile by staffId.
   * Called from: GET /staff/me
   *
   * Note: staffId from JWT is actually the userId (sub field in JWT payload)
   */
  async getCurrentStaff(staffId: string): Promise<StaffEntity> {
    // First verify user has active TenantUserEntity with role='staff'
    const tenantUser = await this.tenantUserRepo.findOne({
      where: { userId: staffId, role: 'staff', status: 'active' },
      relations: ['user', 'tenant'],
    });

    if (!tenantUser) {
      throw new NotFoundException(
        `Staff record not found or inactive for user ${staffId}`,
      );
    }

    // Find StaffEntity linked to this user and tenant
    let staff = await this.staffRepo.findOne({
      where: { userId: staffId, tenantId: tenantUser.tenantId },
      relations: ['user', 'tenant'],
    });

    // If StaffEntity doesn't exist but TenantUserEntity does (e.g., created by admin),
    // create a minimal StaffEntity record
    if (!staff && tenantUser) {
      staff = this.staffRepo.create({
        tenantId: tenantUser.tenantId,
        userId: tenantUser.userId,
        fullName: tenantUser.user.fullName,
        position: 'STAFF', // Default position
        isActive: tenantUser.status === 'active',
      });
      staff = await this.staffRepo.save(staff);
    }

    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${staffId}`);
    }

    return staff;
  }

  /**
   * Update staff profile (name, position, phone, gender, password).
   * Called from: PUT /staff/me
   */
  async updateStaffProfile(
    userId: string,
    dto: UpdateStaffDto,
  ): Promise<StaffEntity> {
    // First verify user has active TenantUserEntity with role='staff'
    const tenantUser = await this.tenantUserRepo.findOne({
      where: { userId, role: 'staff', status: 'active' },
      relations: ['user', 'tenant'],
    });

    if (!tenantUser) {
      throw new NotFoundException(
        `Staff record not found or inactive for user ${userId}`,
      );
    }

    // Find StaffEntity linked to this user and tenant
    const staff = await this.staffRepo.findOne({
      where: { userId, tenantId: tenantUser.tenantId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${userId}`);
    }

    // Handle password update - update in UserEntity
    if (dto.password && staff.user) {
      const hashed = await bcrypt.hash(dto.password, 10);
      staff.user.passwordHash = hashed;
      await this.userRepo.save(staff.user);
    }

    // Update staff-specific fields
    if (dto.fullName !== undefined) {
      staff.fullName = dto.fullName;
      // Also update in UserEntity if user exists
      if (staff.user) {
        staff.user.fullName = dto.fullName;
        await this.userRepo.save(staff.user);
      }
    }
    if (dto.position !== undefined) staff.position = dto.position;
    if (dto.phoneNumber !== undefined) staff.phoneNumber = dto.phoneNumber;
    if (dto.gender !== undefined) staff.gender = dto.gender;

    const updated = await this.staffRepo.save(staff);
    return updated;
  }

  /**
   * Update staff email.
   * Called from: PATCH /staff/me/email
   */
  async updateStaffEmail(
    staffId: string,
    newEmail: string,
  ): Promise<StaffEntity> {
    if (!newEmail) {
      throw new BadRequestException('New email must be provided');
    }

    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    // Check if email is already used by another user
    const existingUser = await this.userRepo.findOne({
      where: { email: newEmail.toLowerCase().trim() },
    });

    if (existingUser && existingUser.id !== staff.userId) {
      // Check if that user is already staff for this tenant
      const duplicateStaff = await this.staffRepo.findOne({
        where: { tenantId: staff.tenantId, userId: existingUser.id },
      });

      if (duplicateStaff) {
        throw new ConflictException(
          `Email ${newEmail} is already used by another staff member in this tenant`,
        );
      }
    }

    // Update email in UserEntity
    if (staff.user) {
      staff.user.email = newEmail.toLowerCase().trim();
      await this.userRepo.save(staff.user);
    } else {
      throw new NotFoundException(`User record not found for staff ${staffId}`);
    }

    return staff;
  }

  /**
   * Soft-delete (deactivate) a staff member.
   * Called from: DELETE /staff/:id
   *
   * This method:
   * 1. Deactivates StaffEntity (sets isActive = false)
   * 2. Updates TenantUserEntity status to 'inactive' (prevents authentication)
   */
  async deleteStaff(staffId: string): Promise<{ message: string }> {
    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    // Step 1: Deactivate StaffEntity
    staff.isActive = false;
    await this.staffRepo.save(staff);

    // Step 2: Sync TenantUserEntity status to 'inactive' to prevent authentication
    // This ensures staff cannot login after deactivation
    await this.syncTenantUserStatus(staff.tenantId, staff.userId, false);

    return { message: 'Staff member deactivated successfully' };
  }

  /**
   * =====================================================
   * TICKET CHECK-IN & LIST
   * =====================================================
   */

  /**
   * Check in a ticket using scanned QR payload or ticket id.
   * Called from: POST /staff/:id/checkin
   */
  async checkInTicket(
    userId: string,
    tenantId: string,
    dto: CheckinDto,
  ): Promise<{ message: string; ticket: Partial<Ticket> }> {
    const { ticketId } = dto;

    if (!ticketId) {
      throw new BadRequestException('Ticket ID is required');
    }

    const staff = await this.staffRepo.findOne({ where: { userId, tenantId } });
    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${userId} in tenant ${tenantId}`);
    }

    // 1. Find Ticket (Simple lookup by ID)
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['order', 'order.event', 'ticketType'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // 2. Check status
    if (ticket.checked_in_at) {
      throw new BadRequestException('Ticket has already been checked in');
    }

    // 3. Update status
    ticket.checked_in_at = new Date();
    const savedTicket = await this.ticketRepo.save(ticket);

    // 4. Return success
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { qr_code_payload, ...safeTicket } = savedTicket;

    return {
      message: 'Ticket checked in successfully',
      ticket: safeTicket,
    };
  }

  /**
   * List tickets for a tenant with simple pagination.
   * Called from: GET /staff/tickets
   */
  async getAssignedTickets(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Partial<Ticket>[]; total: number; page: number }> {
    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { order: { tenant_id: tenantId } },
      relations: ['order', 'order.event', 'ticketType'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    type SafeTicket = Omit<Ticket, 'qr_code_payload'>;
    const safeTickets: SafeTicket[] = tickets.map((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { qr_code_payload, ...rest } = t;
      return rest as SafeTicket;
    });

    return {
      data: safeTickets,
      total,
      page,
    };
  }

  /**
   * =====================================================
   * ACTIVITY LOG METHODS (1:N Staff → ActivityLogs)
   * =====================================================
   */

  /**
   * Get all logs for a tenant.
   * Called from: GET /staff/logs
   */
  async getTenantActivityLogs(
    tenantId: string,
    page: number,
    limit: number,
    actorId?: string,
  ): Promise<{ data: ActivityLogEntity[]; total: number }> {
    const whereCondition: any = { tenantId };
    if (actorId) {
      whereCondition.actorId = actorId;
    }

    const [logs, total] = await this.activityLogRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['actor'], // Include who reported it
    });

    return { data: logs, total };
  }

  /**
   * Get logs for a staff member.
   * Called from: GET /staff/:id/logs
   */
  async getStaffActivityLogs(
    staffId: string,
    page: number,
    limit: number,
  ): Promise<{ data: ActivityLogEntity[]; total: number }> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    const [logs, total] = await this.activityLogRepo.findAndCount({
      where: { actorId: staff.userId, tenantId: staff.tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: logs, total };
  }

  /**
   * Create a log entry for a staff actor.
   * Called from: POST /staff/:id/logs
   */
  async createActivityLog(
    staffId: string,
    action: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLogEntity> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    const log = this.activityLogRepo.create({
      tenantId: staff.tenantId,
      actorId: staff.userId, // MUST be userId to satisfy FK to users table
      action,
      metadata: {
        description,
        status: 'PENDING', // Default status for reported incidents
        ...(metadata || {}),
      },
    });

    return this.activityLogRepo.save(log);
  }

  /**
   * Delete a log by its id.
   * Called from: DELETE /staff/:id/logs/:logId
   */
  async deleteActivityLog(logId: string): Promise<{ message: string }> {
    const log = await this.activityLogRepo.findOne({ where: { id: logId } });

    if (!log) {
      throw new NotFoundException(`Activity log with id ${logId} not found`);
    }

    await this.activityLogRepo.remove(log);

    return { message: 'Activity log deleted successfully' };
  }

  /**
   * =====================================================
   * INCIDENT MANAGEMENT METHODS (Using dedicated table)
   * =====================================================
   */

  /**
   * Get all incidents for a tenant.
   */
  async getTenantIncidents(
    tenantId: string,
    page: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: any[]; total: number }> {
    const whereCondition: any = { tenantId };

    // If userId (from sub) is provided, we need to find the staff record first
    if (userId) {
      const staff = await this.staffRepo.findOne({ where: { userId, tenantId } });
      if (staff) {
        whereCondition.staffId = staff.id;
      } else {
        // If no staff record, return empty
        return { data: [], total: 0 };
      }
    }

    const [incidents, total] = await this.incidentRepo.findAndCount({
      where: whereCondition,
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['staff', 'staff.user'],
    });

    // Map to match the previous log structure for easier frontend migration
    const data = incidents.map(inc => ({
      id: inc.id,
      type: inc.type,
      action: inc.type, // Legacy support
      description: inc.description,
      status: inc.status,
      createdAt: inc.createdAt,
      actor: {
        fullName: inc.staff.fullName,
        email: inc.staff.user?.email,
      }
    }));

    return { data, total };
  }

  /**
   * Create an incident entry.
   */
  async createIncident(
    userId: string, // current user ID (sub)
    tenantId: string,
    type: string,
    description: string,
  ): Promise<IncidentEntity> {
    const staff = await this.staffRepo.findOne({ where: { userId, tenantId } });
    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${userId}`);
    }

    const incident = this.incidentRepo.create({
      tenantId,
      staffId: staff.id,
      type,
      description,
      status: 'OPEN',
    });

    return this.incidentRepo.save(incident);
  }

  /**
   * =====================================================
   * REPORTING & SEARCH
   * =====================================================
   */

  /**
   * Attendance records (all checked-in tickets, optionally filtered by event).
   * Called from: GET /staff/attendance-records
   */
  async getAttendanceRecords(
    tenantId: string,
    eventId?: string,
  ): Promise<Ticket[]> {
    try {
      const qb = this.ticketRepo
        .createQueryBuilder('ticket')
        .innerJoinAndSelect('ticket.order', 'order')
        .innerJoinAndSelect('order.event', 'event')
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere('ticket.checked_in_at IS NOT NULL');

      if (eventId) {
        qb.andWhere('event.id = :eventId', { eventId });
      }

      return await qb.orderBy('ticket.checked_in_at', 'DESC').getMany();
    } catch {
      throw new InternalServerErrorException(
        'Failed to load attendance records',
      );
    }
  }

  /**
   * Search tickets by attendee name or email for a tenant.
   * Called from: GET /staff/search/tickets
   */
  async searchTickets(
    tenantId: string,
    searchTerm: string,
  ): Promise<any[]> {
    let tickets;

    if (!searchTerm || searchTerm.trim().length < 1) {
      // Return recent tickets if no search term
      tickets = await this.ticketRepo.find({
        where: { order: { tenant_id: tenantId } },
        relations: ['order', 'ticketType'],
        order: { created_at: 'DESC' },
        take: 20
      });
    } else {
      tickets = await this.ticketRepo
        .createQueryBuilder('ticket')
        .innerJoinAndSelect('ticket.order', 'order')
        .innerJoinAndSelect('ticket.ticketType', 'ticketType')
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere(
          '(ticket.attendee_name ILIKE :q OR ticket.attendee_email ILIKE :q)',
          { q: `%${searchTerm}%` },
        )
        .orderBy('ticket.created_at', 'DESC')
        .getMany();
    }

    // Transform to frontend-friendly DTO
    return tickets.map((t) => {
      let status = 'VALID';
      if (t.checked_in_at) {
        status = 'CHECKED_IN';
      } else if (t.status) {
        status = t.status.toUpperCase();
      }

      return {
        id: t.id,
        attendeeName: t.attendee_name,
        attendeeEmail: t.attendee_email,
        orderNumber: t.order.public_lookup_token || t.order.id, // Prefer short token
        ticketType: t.ticketType ? t.ticketType.name : 'Unknown Ticket',
        seatInfo: t.seat_label || 'General Admission',
        status: status,
      };
    });
  }

  /**
   * =====================================================
   * EVENT READ-ONLY ACCESS (Per Plan Requirements)
   * =====================================================
   */

  /**
   * List all events for a tenant (read-only).
   * Called from: GET /staff/events
   */
  async getTenantEvents(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Event[]; total: number; page: number }> {
    const [events, total] = await this.eventRepo.findAndCount({
      where: { tenant_id: tenantId },
      relations: ['ticketTypes'],
      skip: (page - 1) * limit,
      take: limit,
      order: { start_at: 'ASC' },
    });

    return { data: events, total, page };
  }

  /**
   * Get event details by ID (read-only).
   * Called from: GET /staff/events/:id
   */
  async getEventById(tenantId: string, eventId: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, tenant_id: tenantId },
      relations: ['ticketTypes', 'sessions'],
    });

    if (!event) {
      throw new NotFoundException(
        `Event with id ${eventId} not found for this tenant`,
      );
    }

    return event;
  }

  /**
   * Get ticket types for an event (read-only).
   * Called from: GET /staff/events/:id/ticket-types
   */
  async getEventTicketTypes(
    tenantId: string,
    eventId: string,
  ): Promise<TicketType[]> {
    // Verify event belongs to tenant
    const event = await this.eventRepo.findOne({
      where: { id: eventId, tenant_id: tenantId },
    });

    if (!event) {
      throw new NotFoundException(
        `Event with id ${eventId} not found for this tenant`,
      );
    }

    const ticketTypes = await this.ticketTypeRepo.find({
      where: { event_id: eventId },
      order: { price_taka: 'ASC' },
    });

    return ticketTypes;
  }

  /**
   * Get remaining capacity for an event.
   * Called from: GET /staff/events/:id/capacity
   */
  async getEventCapacity(
    tenantId: string,
    eventId: string,
  ): Promise<{
    eventId: string;
    eventName: string;
    ticketTypes: Array<{
      id: string;
      name: string;
      total: number;
      sold: number;
      remaining: number;
      percentageSold: number;
    }>;
    totalCapacity: number;
    totalSold: number;
    totalRemaining: number;
  }> {
    // Verify event belongs to tenant
    const event = await this.eventRepo.findOne({
      where: { id: eventId, tenant_id: tenantId },
    });

    if (!event) {
      throw new NotFoundException(
        `Event with id ${eventId} not found for this tenant`,
      );
    }

    const ticketTypes = await this.ticketTypeRepo.find({
      where: { event_id: eventId },
    });

    const capacityData = ticketTypes.map((tt) => ({
      id: tt.id,
      name: tt.name,
      total: tt.quantity_total,
      sold: tt.quantity_sold,
      remaining: tt.quantity_total - tt.quantity_sold,
      percentageSold:
        tt.quantity_total > 0
          ? Math.round((tt.quantity_sold / tt.quantity_total) * 100)
          : 0,
    }));

    const totalCapacity = ticketTypes.reduce(
      (sum, tt) => sum + tt.quantity_total,
      0,
    );
    const totalSold = ticketTypes.reduce(
      (sum, tt) => sum + tt.quantity_sold,
      0,
    );
    const totalRemaining = totalCapacity - totalSold;

    return {
      eventId: event.id,
      eventName: event.name,
      ticketTypes: capacityData,
      totalCapacity,
      totalSold,
      totalRemaining,
    };
  }

  /**
   * =====================================================
   * ORDER LOOKUP (Per Plan Requirements)
   * =====================================================
   */

  /**
   * Search orders by buyer email.
   * Called from: GET /staff/orders/search?email=...
   */
  async searchOrdersByEmail(tenantId: string, email: string): Promise<any[]> {
    let whereCondition: any = { tenant_id: tenantId };

    if (email && email.trim().length > 0) {
      whereCondition.buyer_email = email.toLowerCase().trim();
    }
    // If no email provided, it effectively returns recent orders due to the take: 20 below

    const orders = await this.orderRepo.find({
      where: whereCondition,
      relations: ['event', 'tickets', 'orderItems'],
      order: { created_at: 'DESC' },
      take: 20, // Limit to 20 for safety
    });

    return orders.map((o) => ({
      id: o.id,
      customerName: o.buyer_name,
      email: o.buyer_email,
      status: o.status,
      items: o.orderItems ? o.orderItems.length : 0,
      amount: o.total_taka,
    }));
  }

  /**
   * Search order by code (public lookup token or order ID).
   * Called from: GET /staff/orders/search?code=...
   */
  async searchOrderByCode(
    tenantId: string,
    code: string,
  ): Promise<any | null> {
    if (!code || code.trim().length < 3) {
      throw new BadRequestException('Code must be at least 3 characters long');
    }

    const order = await this.orderRepo.findOne({
      where: [{ tenant_id: tenantId, id: code }, { tenant_id: tenantId, public_lookup_token: code }],
      relations: ['event', 'tickets', 'tickets.ticketType', 'orderItems'],
    });

    if (!order) return null;

    return {
      id: order.id,
      customerName: order.buyer_name,
      email: order.buyer_email,
      status: order.status,
      items: order.orderItems ? order.orderItems.length : 0,
      amount: order.total_taka,
    };
  }

  /**
   * Resolve an incident.
   */
  async resolveIncident(
    userId: string, // current user ID (sub)
    tenantId: string,
    incidentId: string,
    resolutionNotes: string,
    resolutionType: string,
  ): Promise<IncidentEntity> {
    // Get current staff member
    const staff = await this.staffRepo.findOne({ where: { userId, tenantId } });
    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${userId}`);
    }

    // Find incident
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId, tenantId },
      relations: ['staff', 'resolvedByStaff'],
    });

    if (!incident) {
      throw new NotFoundException(
        `Incident with id ${incidentId} not found for this tenant`,
      );
    }

    // Check permissions: SUPERVISOR can resolve any, others can only resolve their own
    if (staff.position !== 'SUPERVISOR' && incident.staffId !== staff.id) {
      throw new ForbiddenException(
        'You can only resolve your own incidents. Contact a supervisor for assistance.',
      );
    }

    // Update incident
    incident.status = 'RESOLVED';
    incident.resolutionNotes = resolutionNotes;
    incident.resolutionType = resolutionType;
    incident.resolvedAt = new Date();
    incident.resolvedByStaffId = staff.id;

    return this.incidentRepo.save(incident);
  }

  /**
   * =====================================================
   * DASHBOARD STATS METHODS
   * =====================================================
   */

  /**
   * Get dashboard stats for a staff member.
   */
  async getDashboardStats(userId: string, tenantId: string): Promise<any> {
    // Get staff info with position
    const staff = await this.staffRepo.findOne({ where: { userId, tenantId } });
    if (!staff) {
      throw new NotFoundException(`Staff record not found for user ${userId}`);
    }

    // Count checked-in tickets today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ticketsCheckedToday = await this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoinAndSelect('ticket.order', 'order')
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('ticket.checked_in_at >= :today', { today })
      .andWhere('ticket.checked_in_at < :tomorrow', { tomorrow })
      .getCount();

    // Count open incidents for staff
    const openIncidents =
      staff.position === 'SUPERVISOR'
        ? await this.incidentRepo.count({
          where: { tenantId, status: 'OPEN' },
        })
        : await this.incidentRepo.count({
          where: { tenantId, staffId: staff.id, status: 'OPEN' },
        });

    // Count resolved incidents this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const resolvedThisWeek =
      staff.position === 'SUPERVISOR'
        ? await this.incidentRepo.count({
          where: {
            tenantId,
            status: 'RESOLVED',
            resolvedAt: Between(weekAgo, new Date()),
          },
        })
        : await this.incidentRepo.count({
          where: {
            tenantId,
            staffId: staff.id,
            status: 'RESOLVED',
            resolvedAt: Between(weekAgo, new Date()),
          },
        });

    // Get assigned events
    const assignedEvents = await this.eventRepo.count({
      where: { tenant_id: tenantId },
    });

    return {
      role: staff.position,
      fullName: staff.fullName,
      ticketsCheckedToday,
      openIncidents,
      resolvedThisWeek,
      assignedEvents,
      lastLogin: staff.lastLoginAt,
    };
  }

  /**
   * Get order details by ID
   * Called from: GET /staff/orders/:id
   */
  async getOrderById(
    tenantId: string,
    orderId: string,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: {
        id: orderId,
        tenant_id: tenantId,
      },
      relations: [
        'event',
        'orderItems',
        'orderItems.ticketType',
        'tickets',
        'payments',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${orderId} not found for this tenant`,
      );
    }

    return order;
  }
}
