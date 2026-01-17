import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { EventsService } from '../events/events.service';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('public')
export class PublicController {
  constructor(
    private readonly adminService: AdminService,
    private readonly eventsService: EventsService
  ) {}

  @Public()
  @Get('tenant/:slug')
  async getTenantData(@Param('slug') slug: string) {
    // 1. Find Tenant by Slug
    const tenant = await this.adminService.getTenantBySlug(slug);
    
    // 2. Get Config (Theme, Colors, etc.)
    const config = await this.adminService.getTenantConfig(tenant.id);

    // 3. Get Public Events
    const events = await this.eventsService.getPublicEvents(tenant.id);

    return {
      tenant,
      config,
      theme: config.theme,
      events
    };
  }

  @Public()
  @Get('events/:slug')
  async getGlobalEvent(@Param('slug') slug: string) {
    return this.eventsService.getEventByGlobalSlug(slug);
  }

  @Public()
  @Get(':tenantSlug/:eventSlug')
  async getPublicEvent(
    @Param('tenantSlug') tenantSlug: string,
    @Param('eventSlug') eventSlug: string,
  ) {
    const event = await this.eventsService.getEventBySlug(tenantSlug, eventSlug);
    
    return {
      event,
    };
  }
}
