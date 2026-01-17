
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, UploadedFile, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('tenant-admin/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async getAllEvents(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.eventsService.getEventsByTenant(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    const tenantId = req.user.tenantId;
    return this.eventsService.createEvent(tenantId, createEventDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async updateEvent(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }

  // Image Upload Endpoints
  @Post(':id/upload-banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadBannerImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.eventsService.uploadBannerImages(id, files);
  }

  @Post(':id/upload-gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  @UseInterceptors(FilesInterceptor('images', 20))
  async uploadGalleryImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.eventsService.uploadGalleryImages(id, files);
  }

  @Delete(':id/images/:imageUrl')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async deleteImage(
    @Param('id') id: string,
    @Param('imageUrl') imageUrl: string,
  ) {
    return this.eventsService.deleteImage(id, decodeURIComponent(imageUrl));
  }

  // Theme Customization Endpoints
  @Put(':id/theme-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async updateThemeContent(
    @Param('id') id: string,
    @Body() themeContent: any,
  ) {
    return this.eventsService.updateThemeContent(id, themeContent);
  }

  @Put(':id/seo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async updateSeoSettings(
    @Param('id') id: string,
    @Body() seoSettings: any,
  ) {
    return this.eventsService.updateSeoSettings(id, seoSettings);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TenantAdmin')
  async publishEvent(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.eventsService.publishEvent(id, isPublished);
  }


}
