
import { Injectable, Logger } from '@nestjs/common';
// import * as sgMail from '@sendgrid/mail';
// import type { MailDataRequired } from '@sendgrid/mail';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
    private readonly logger = new Logger;

    constructor() {
        this.logger = new Logger(EmailService.name);
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    }

    // async basicEmailOld(data, resolve, reject) {
    //     var msg: MailDataRequired = {
    //         from: "Garri <admin@garrilogistics.com>",
    //         to: data.email,
    //         subject: data.subject, // email subject
    //         html: data.body, // email content in HTML
    //     };

    //     if (data.attachments) {
    //         msg = {
    //             from: "Garri <admin@garrilogistics.com>",
    //             to: data.email,
    //             subject: data.subject, // email subject
    //             html: data.body, // email content in HTML
    //         };
    //     }
    //     let emresult = sgMail.send(msg)
    //         .then(() => {
    //             resolve(true);
    //             return true;
    //         })
    //         .catch((error) => {
    //             this.logger.error('Error while sending email', error);
    //             throw error;

    //         });
    // }
    async basicEmail(data, resolve, reject) {
        const api_Key = process.env.BREVO_API_KEY;
        const client = new Brevo.TransactionalEmailsApi();
        client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, api_Key);
        var msg: Brevo.SendSmtpEmail = {
            sender: { name: 'Electric Service Administration', email: 'yayasoles@gmail.com' },
            to: [{ email: data.email, name: data?.name }],
            subject: data.subject, // email subject
            htmlContent: data.body, // email content in HTML
        };
        if (data.attachments) {
            msg = {
                sender: { name: 'Electric Service Administration', email: 'yayasoles@gmail.com' },
                to: [{ email: data.email, name: data?.name }],
                subject: data.subject, // email subject
                htmlContent: data.body, // email content in HTML
                attachment: data.attachments.map((itemat, idxat) => {
                  return {
                    content: itemat.content,
                    filename: itemat.filename,
                    type: itemat.type,
                    disposition: "attachment",
                  };
                }),
            };
        }
        client
            .sendTransacEmail(msg)
            .then((data) => {
                this.logger.log('✅ Email sent:', data);
                resolve(true);
            })
            .catch((error) => {
                this.logger.error('❌ Email failed:', error.response?.data || error);
                reject(error.response?.data || error);
            });
    }
}
