import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient(apiKey?: string): Resend | null {
  if (!apiKey) {
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  
  return resendClient;
}

export async function sendVerificationEmail(
  apiKey: string | undefined,
  email: string,
  code: string,
): Promise<void> {
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set - cannot send email');
    return;
  }

  const client = getResendClient(apiKey);
  if (!client) {
    throw new Error('Failed to initialize Resend client');
  }

  const codeTtl = parseInt(process.env.CODE_TTL_SECONDS || '900', 10);
  const minutes = Math.floor(codeTtl / 60);

  try {
    await client.emails.send({
      from: 'noreply@studentdeals.uz',
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
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

