import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars if not already loaded (though index.js should handle this)
dotenv.config({ path: path.join(__dirname, '../.env') });

const createTransporter = () => {
    // Check if SMTP credentials exist
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, html }) => {
    const from = process.env.SMTP_FROM || '"Symphony" <no-reply@symphony.com>';

    if (!transporter) {
        console.log('--- EMAIL SERVICE (Dry Run) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('--- HTML Content Preview ---');
        console.log(html.substring(0, 500) + '...');
        console.log('-------------------------------');
        return { messageId: 'mock-id', response: 'Dry Run: Email logged to console' };
    }

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });
        console.log(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback to logging if actual send fails
        console.log('--- EMAIL FAILED TO SEND, LOGGING INSTEAD ---');
        console.log(`To: ${to}`);
        console.log(html);
        throw error;
    }
};

export const sendInvitationEmail = async ({ email, organizationName, invitedBy, token, role }) => {
    const joinLink = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

    // Professional HTML Template using Symphony's Teal theme
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 32px; color: #374151; }
            .button { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 24px; }
            .button:hover { background: #1e293b; }
            .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Symphony</h1>
            </div>
            <div class="content">
                <h2>You've been invited!</h2>
                <p>Hello,</p>
                <p><strong>${invitedBy}</strong> has invited you to join the organization <strong>${organizationName}</strong> on Symphony as a <strong>${role}</strong>.</p>
                <p>Symphony helps teams collaborate on projects, track tasks, and streamline workflows.</p>
                <center>
                    <a href="${joinLink}" class="button" style="color: #ffffff;">Join Organization</a>
                </center>
                <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
                    If you didn't expect this invitation, you can safely ignore this email.<br>
                    This link will expire in 7 days.
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Symphony. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: `Invitation to join ${organizationName} on Symphony`,
        html
    });
};

export default { sendEmail, sendInvitationEmail };
