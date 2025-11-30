import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';


import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { StaffEntity } from './staff.entity';
import { ActivityLogEntity } from '../admin/activity-log.entity';
import { CreateStaffDto, UpdateStaffDto, CheckinDto  } from './staff.dto';

import { TicketEntity } from '../entities/ticket.entity';
import { MailerService } from '../mailer/mailer.service';


@Injectable()
export class StaffService {
  constructor(

    @InjectRepository(StaffEntity)
    private readonly staffRepo: Repository<StaffEntity>,

    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepo: Repository<ActivityLogEntity>,

    @InjectRepository(TicketEntity)
    private readonly ticketRepo: Repository<TicketEntity>,

    private readonly mailerService: MailerService,
    
  ) {}

  /**
   * =====================================================
   * STAFF MANAGEMENT METHODS
   * =====================================================
   */

  /**
   * Create a new staff member for a tenant.
   * Called from: POST /staff/register
   */
  async registerStaff(
    tenantId: string,
    dto: CreateStaffDto,
  ): Promise<Omit<StaffEntity, 'passwordHash'>> {
    // Check if email already exists for this tenant
    const existing = await this.staffRepo.findOne({
      where: { tenantId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Staff with email ${dto.email} already exists in this tenant`,
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const staff = this.staffRepo.create({
      tenantId,
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      position: dto.position,
      phoneNumber: dto.phoneNumber ?? null,
      gender: dto.gender ?? null,
      isActive: true,
    });

    const saved = await this.staffRepo.save(staff);

    // Try sending a welcome / invitation email (optional)
    try {
      await this.mailerService.sendStaffInvitationEmail({
        to: saved.email,
        name: saved.fullName,
      });
    } catch (error) {
      // Do not block registration on email failures
      console.warn('Failed to send staff invitation email:', error.message);
    }

    // Remove passwordHash before returning
    const { passwordHash: _, ...safeStaff } = saved;
    return safeStaff;
  }

  /**
   * Get currently logged-in staff profile by staffId.
   * Called from: GET /staff/me
   */
  async getCurrentStaff(
    staffId: string,
  ): Promise<Omit<StaffEntity, 'passwordHash'>> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });

    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    const { passwordHash, ...safeStaff } = staff;
    return safeStaff;
  }

  /**
   * Update staff profile (name, position, phone, gender, password).
   * Called from: PUT /staff/me
   */
  async updateStaffProfile(
    staffId: string,
    dto: UpdateStaffDto,
  ): Promise<Omit<StaffEntity, 'passwordHash'>> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });

    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    // Handle password update separately
    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      (staff as any).passwordHash = hashed;
    }

    // Update other fields
    if (dto.fullName !== undefined) staff.fullName = dto.fullName;
    if (dto.position !== undefined) staff.position = dto.position;
    if (dto.phoneNumber !== undefined) staff.phoneNumber = dto.phoneNumber;
    if (dto.gender !== undefined) staff.gender = dto.gender;

    const updated = await this.staffRepo.save(staff);

    const { passwordHash, ...safeStaff } = updated;
    return safeStaff;
  }

  /**
   * Update staff email.
   * Called from: PATCH /staff/me/email
   */
  async updateStaffEmail(
    staffId: string,
    newEmail: string,
  ): Promise<Omit<StaffEntity, 'passwordHash'>> {
    if (!newEmail) {
      throw new BadRequestException('New email must be provided');
    }

    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    // Check uniqueness within tenant
    const duplicate = await this.staffRepo.findOne({
      where: { tenantId: staff.tenantId, email: newEmail },
    });

    if (duplicate && duplicate.id !== staff.id) {
      throw new ConflictException(
        `Email ${newEmail} is already used by another staff`,
      );
    }

    staff.email = newEmail;
    const updated = await this.staffRepo.save(staff);

    const { passwordHash, ...safeStaff } = updated;
    return safeStaff;
  }

  /**
   * Soft-delete (deactivate) a staff member.
   * Called from: DELETE /staff/:id
   */
  async deleteStaff(staffId: string): Promise<{ message: string }> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });

    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    staff.isActive = false;
    await this.staffRepo.save(staff);

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
    staffId: string,
    dto: CheckinDto,
  ): Promise<{ message: string; ticket: Partial<TicketEntity> }> {
    if (!dto.qrPayload) {
      throw new BadRequestException('QR payload is required');
    }

    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff with id ${staffId} not found`);
    }

    // Find ticket by qrCodePayload or by id
    const ticket = await this.ticketRepo.findOne({
      where: [
        { qrCodePayload: dto.qrPayload },
        { id: dto.qrPayload as any },
      ],
      relations: ['order', 'order.event'],
    });

    if (!ticket) {
      // Log invalid scan
      await this.activityLogRepo.save(
        this.activityLogRepo.create({
          tenantId: staff.tenantId,
          actorId: staff.id,
          action: 'INVALID_QR',
          metadata: { qrPayload: dto.qrPayload },
        }),
      );

      throw new NotFoundException('Ticket not found for given QR payload');
    }

    // Already checked in?
    if (ticket.checkedInAt) {
      await this.activityLogRepo.save(
        this.activityLogRepo.create({
          tenantId: staff.tenantId,
          actorId: staff.id,
          action: 'DUPLICATE_SCAN',
          metadata: {
            ticketId: ticket.id,
            checkedInAt: ticket.checkedInAt,
          },
        }),
      );

      throw new BadRequestException('Ticket has already been checked in');
    }

    // Mark as checked in
    ticket.checkedInAt = new Date();

    const savedTicket = await this.ticketRepo.save(ticket);

    // Log success
    await this.activityLogRepo.save(
      this.activityLogRepo.create({
        tenantId: staff.tenantId,
        actorId: staff.id,
        action: 'CHECKIN_SUCCESS',
        metadata: {
          ticketId: ticket.id,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          eventId: ticket.order?.eventId,
        },
      }),
    );

    // Optionally send confirmation email
    try {
      if (ticket.attendeeEmail) {
        await this.mailerService.sendCheckinConfirmationEmail({
          to: ticket.attendeeEmail,
          name: ticket.attendeeName,
          eventName: ticket.order?.event?.name,
        });
      }
    } catch (error) {
      console.warn('Failed to send check-in confirmation email:', error.message);
    }

    // Hide QR payload in response
    const { qrCodePayload, ...safeTicket } = savedTicket as any;

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
  ): Promise<{ data: Partial<TicketEntity>[]; total: number; page: number }> {
    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { order: { tenantId } },
      relations: ['order', 'order.event', 'ticketType'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const safeTickets = tickets.map((t) => {
      const { qrCodePayload, ...rest } = t as any;
      return rest;
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
      where: { actorId: staffId, tenantId: staff.tenantId },
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
      actorId: staffId,
      action,
      metadata: {
        description,
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
  ): Promise<TicketEntity[]> {
    try {
      const qb = this.ticketRepo
        .createQueryBuilder('ticket')
        .innerJoinAndSelect('ticket.order', 'order')
        .innerJoinAndSelect('order.event', 'event')
        .where('order.tenantId = :tenantId', { tenantId })
        .andWhere('ticket.checkedInAt IS NOT NULL');

      if (eventId) {
        qb.andWhere('event.id = :eventId', { eventId });
      }

      return await qb.orderBy('ticket.checkedInAt', 'DESC').getMany();
    } catch (error) {
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
  ): Promise<Partial<TicketEntity>[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException(
        'Search term must be at least 2 characters long',
      );
    }

    const tickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoinAndSelect('ticket.order', 'order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(ticket.attendeeName ILIKE :q OR ticket.attendeeEmail ILIKE :q)',
        { q: `%${searchTerm}%` },
      )
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();

    return tickets.map((t) => {
      const { qrCodePayload, ...rest } = t as any;
      return rest;
    });
  }
}
