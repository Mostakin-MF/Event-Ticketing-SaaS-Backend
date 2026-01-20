import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';

export interface AttendeeNotificationPayload {
    eventName?: string;
    eventDate?: string;
    amount?: number;
    orderId?: string;
    ticketCount?: number;
    message?: string;
    refundAmount?: number;
    cancellationReason?: string;
}

@Injectable()
export class AttendeeNotificationService {
    private pusher: Pusher;
    private readonly logger = new Logger(AttendeeNotificationService.name);

    constructor() {
        const appId = process.env.PUSHER_APP_ID;
        const key = process.env.PUSHER_KEY;
        const secret = process.env.PUSHER_SECRET;
        const cluster = process.env.PUSHER_CLUSTER;

        if (!appId || !key || !secret || !cluster) {
            this.logger.warn('Pusher credentials not configured. Attendee notifications will be disabled.');
            return;
        }

        this.pusher = new Pusher({
            appId,
            key,
            secret,
            cluster,
            useTLS: true,
        });

        this.logger.log('AttendeeNotificationService initialized');
    }

    /**
     * Send ticket purchased notification
     */
    async notifyTicketPurchased(
        userId: string,
        payload: AttendeeNotificationPayload,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, 'ticket-purchased', {
                eventName: payload.eventName,
                eventDate: payload.eventDate,
                ticketCount: payload.ticketCount,
                orderId: payload.orderId,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Ticket purchased notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send ticket purchased notification: ${error}`);
        }
    }

    /**
     * Send payment received notification
     */
    async notifyPaymentReceived(
        userId: string,
        payload: AttendeeNotificationPayload,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, 'payment-received', {
                amount: payload.amount,
                orderId: payload.orderId,
                message: `Payment of ৳${payload.amount} has been confirmed`,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Payment received notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send payment received notification: ${error}`);
        }
    }

    /**
     * Send event reminder notification
     */
    async notifyEventReminder(
        userId: string,
        payload: AttendeeNotificationPayload,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, 'event-reminder', {
                eventName: payload.eventName,
                eventDate: payload.eventDate,
                message: `Don't forget! ${payload.eventName} is coming up`,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Event reminder notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send event reminder notification: ${error}`);
        }
    }

    /**
     * Send ticket cancelled notification
     */
    async notifyTicketCancelled(
        userId: string,
        payload: AttendeeNotificationPayload,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, 'ticket-cancelled', {
                eventName: payload.eventName,
                refundAmount: payload.refundAmount,
                reason: payload.cancellationReason,
                message: `Your ticket has been cancelled. Refund of ৳${payload.refundAmount} will be processed.`,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Ticket cancelled notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send ticket cancelled notification: ${error}`);
        }
    }

    /**
     * Send order status update notification
     */
    async notifyOrderStatusUpdate(
        userId: string,
        payload: AttendeeNotificationPayload,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger(`private-attendee-${userId}`, 'order-status', {
                orderId: payload.orderId,
                message: payload.message,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Order status notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send order status notification: ${error}`);
        }
    }

    /**
     * Send broadcast notification to all attendees (e.g., platform announcements)
     */
    async broadcastToAllAttendees(
        event: string,
        data: any,
    ): Promise<void> {
        if (!this.pusher) {
            this.logger.warn('Pusher not configured. Skipping notification.');
            return;
        }

        try {
            await this.pusher.trigger('attendees-broadcast', event, {
                ...data,
                timestamp: new Date().toISOString(),
            });
            this.logger.debug(`Broadcast notification sent: ${event}`);
        } catch (error) {
            this.logger.error(`Failed to send broadcast notification: ${error}`);
        }
    }
}
