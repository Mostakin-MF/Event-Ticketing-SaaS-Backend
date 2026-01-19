import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
    private pusher: Pusher;
    private readonly logger = new Logger(PusherService.name);

    constructor() {
        const appId = process.env.PUSHER_APP_ID;
        const key = process.env.PUSHER_KEY;
        const secret = process.env.PUSHER_SECRET;
        const cluster = process.env.PUSHER_CLUSTER;

        if (!appId || !key || !secret || !cluster) {
            this.logger.warn('Pusher credentials not configured. Real-time notifications will be disabled.');
            return;
        }

        this.pusher = new Pusher({
            appId,
            key,
            secret,
            cluster,
            useTLS: true,
        });

        this.logger.log('Pusher service initialized successfully');
    }

    /**
     * Trigger event for Tenant Admin
     * @param tenantId - The tenant ID
     * @param event - Event name (e.g., 'new-order', 'staff-invited')
     * @param data - Event payload
     */
    async triggerTenantEvent(tenantId: string, event: string, data: any): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping event trigger.');
            return;
        }

        try {
            await this.pusher.trigger(`tenant-${tenantId}`, event, data);
            this.logger.debug(`Event '${event}' triggered for tenant-${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to trigger event '${event}' for tenant-${tenantId}:`, error);
        }
    }

    /**
     * Trigger event for specific Staff member (private channel)
     * @param userId - The staff user ID
     * @param event - Event name (e.g., 'event-assigned', 'shift-reminder')
     * @param data - Event payload
     */
    async triggerStaffEvent(userId: string, event: string, data: any): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping event trigger.');
            return;
        }

        try {
            await this.pusher.trigger(`private-staff-${userId}`, event, data);
            this.logger.debug(`Event '${event}' triggered for private-staff-${userId}`);
        } catch (error) {
            this.logger.error(`Failed to trigger event '${event}' for staff ${userId}:`, error);
        }
    }

    /**
     * Trigger event for all staff in a tenant (public channel)
     * @param tenantId - The tenant ID
     * @param event - Event name
     * @param data - Event payload
     */
    async triggerStaffBroadcast(tenantId: string, event: string, data: any): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping event trigger.');
            return;
        }

        try {
            await this.pusher.trigger(`staff-${tenantId}`, event, data);
            this.logger.debug(`Event '${event}' broadcast to staff-${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to broadcast event '${event}' to staff of tenant ${tenantId}:`, error);
        }
    }

    /**
     * Trigger event for specific Attendee (private channel)
     * @param userId - The attendee user ID
     * @param event - Event name (e.g., 'ticket-purchased', 'event-reminder')
     * @param data - Event payload
     */
    async triggerAttendeeEvent(userId: string, event: string, data: any): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping event trigger.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, event, data);
            this.logger.debug(`Event '${event}' triggered for private-attendee-${userId}`);
        } catch (error) {
            this.logger.error(`Failed to trigger event '${event}' for attendee ${userId}:`, error);
        }
    }

    /**
     * Authenticate private channels
     * @param socketId - Socket ID from Pusher
     * @param channel - Channel name to authenticate
     * @param user - Authenticated user object
     * @returns Pusher auth response
     */
    authenticateChannel(socketId: string, channel: string, user: any) {
        if (!this.pusher) {
            throw new Error('Pusher not configured');
        }

        // Verify user has permission for this channel
        if (channel.startsWith('private-staff-')) {
            const userId = channel.replace('private-staff-', '');

            // Check if user is staff and the channel belongs to them
            if (user.id !== userId || user.role !== 'staff') {
                this.logger.warn(`Unauthorized access attempt to ${channel} by user ${user.id} with role ${user.role}`);
                throw new Error('Unauthorized: You do not have access to this staff channel');
            }
        }

        if (channel.startsWith('private-attendee-')) {
            const userId = channel.replace('private-attendee-', '');

            // Check if user is attendee and the channel belongs to them
            if (user.id !== userId || user.role !== 'attendee') {
                this.logger.warn(`Unauthorized access attempt to ${channel} by user ${user.id} with role ${user.role}`);
                throw new Error('Unauthorized: You do not have access to this attendee channel');
            }
        }

        // Authorize the channel
        try {
            const auth = this.pusher.authorizeChannel(socketId, channel);
            this.logger.debug(`Channel ${channel} authorized for user ${user.id}`);
            return auth;
        } catch (error) {
            this.logger.error(`Failed to authorize channel ${channel}:`, error);
            throw error;
        }
    }
}
