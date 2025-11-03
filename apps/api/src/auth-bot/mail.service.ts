import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly fromEmail: string = 'noreply@studentdeals.uz';
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set - email sending will fail');
    } else {
      console.log('Resend initialized with API key:', apiKey.substring(0, 10) + '...');
    }
    this.resend = new Resend(apiKey);
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 
      'https://studentdeals-uz-web.vercel.app';
  }

  async sendVerificationCode(email: string, code: string) {
    const codeTtl = parseInt(process.env.CODE_TTL_SECONDS || '900', 10);
    const minutes = Math.floor(codeTtl / 60);

    console.log(`Attempting to send verification code to ${email}`);
    console.log(`Code: ${code}, From: ${this.fromEmail}`);

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your StudentDeals verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">StudentDeals Verification</h1>
            <p>Your verification code is:</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="color: #111827; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h2>
            </div>
            <p style="color: #6B7280;">This code expires in ${minutes} minutes.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      });
      console.log(`✅ Verification code sent to ${email}, result:`, result);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

