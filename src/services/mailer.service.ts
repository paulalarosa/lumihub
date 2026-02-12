import { supabase } from "@/integrations/supabase/client";
import { Logger } from "./logger";

export interface MailerRequest {
    to: string[];
    template: string;
    templateData: Record<string, any>;
    userId?: string;
}

export class Mailer {
    /**
     * Universal method to dispatch templated emails via AWS SES.
     */
    static async sendTemplate(request: MailerRequest): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('send-ses-email', {
                body: request,
            });

            if (error) {
                throw error;
            }

            await Logger.info(`Email dispatch successful: ${request.template}`, request.userId, {
                recipients: request.to,
                template: request.template
            });

            return { success: true };
        } catch (error: any) {
            await Logger.error(`Failed to dispatch email template: ${request.template}`, error, request.userId, {
                request
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Predefined helper for Welcome Emails
     */
    static async sendWelcome(email: string, name: string, userId?: string) {
        return this.sendTemplate({
            to: [email],
            template: 'Khaos_Welcome',
            templateData: { name, email },
            userId
        });
    }

    /**
     * Predefined helper for Order/Invoice Confirmation
     */
    static async sendOrderConfirmation(email: string, name: string, orderId: string, amount: number, userId?: string) {
        return this.sendTemplate({
            to: [email],
            template: 'Khaos_OrderConfirmed',
            templateData: { name, order_id: orderId, amount },
            userId
        });
    }

    /**
     * Predefined helper for Feedback Requests
     */
    static async sendFeedbackRequest(email: string, name: string, orderId: string, userId?: string) {
        return this.sendTemplate({
            to: [email],
            template: 'Khaos_Feedback',
            templateData: { name, order_id: orderId },
            userId
        });
    }
}
