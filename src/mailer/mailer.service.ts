// src/mailer/mailer.service.ts

import { Injectable, Logger } from '@nestjs/common';

export interface StaffInvitationEmailPayload {
  to: string;
  name: string;
}

export interface CheckinConfirmationEmailPayload {
  to: string;
  name: string;
  eventName?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  /**
   * Send staff invitation / welcome email.
   * Used when a new staff member is registered.
   */
  async sendStaffInvitationEmail(
    payload: StaffInvitationEmailPayload,
  ): Promise<void> {
    // TODO: integrate real provider (SendGrid / SES / Resend)
    // For now, just log for debugging.
    this.logger.log(
      `Sending STAFF INVITATION email to ${payload.to} (name=${payload.name})`,
    );

    // Example shape if you later plug in a mailer:
    // await this.mailClient.send({
    //   to: payload.to,
    //   subject: 'You have been invited as staff',
    //   template: 'staff-invitation',
    //   context: { name: payload.name },
    // });
  }

  /**
   * Send check-in confirmation email to attendee.
   * Used after successful ticket scan.
   */
  async sendCheckinConfirmationEmail(
    payload: CheckinConfirmationEmailPayload,
  ): Promise<void> {
    this.logger.log(
      `Sending CHECK-IN CONFIRMATION email to ${payload.to} (name=${payload.name}, event=${payload.eventName})`,
    );

    // TODO: integrate with real email provider.
    // await this.mailClient.send({
    //   to: payload.to,
    //   subject: `You have checked in for ${payload.eventName}`,
    //   template: 'checkin-confirmation',
    //   context: {
    //     name: payload.name,
    //     eventName: payload.eventName,
    //   },
    // });
  }

  /**
   * (Optional) Order confirmation with tickets,
   * for when you implement checkout.
   */
  async sendOrderConfirmationEmail(params: {
    to: string;
    name: string;
    eventName: string;
    tickets: { ticketId: string; qrCodeUrl?: string }[];
  }): Promise<void> {
    this.logger.log(
      `Sending ORDER CONFIRMATION email to ${params.to} for event ${params.eventName} with ${params.tickets.length} tickets`,
    );

    // TODO: implement real email.
  }
}
