export class EmailService {
  async sendOtpEmail(toEmail: string, otp: string, storeName?: string): Promise<{ success: boolean; message: string; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'DukaanOS <onboarding@resend.dev>';
    const storeDisplayName = storeName ? storeName.trim() : 'DukaanOS Store';

    console.log(`\n======================================================`);
    console.log(`🔑 [DukaanOS Verification OTP Dispatch]`);
    console.log(`📧 Recipient: ${toEmail}`);
    console.log(`🏪 Store: ${storeDisplayName}`);
    console.log(`⚡ OTP Code: ${otp}`);
    console.log(`======================================================\n`);

    if (!apiKey || apiKey.includes('your_resend') || apiKey === '') {
      return {
        success: false,
        error: 'RESEND_API_KEY is not configured in .env. Please configure an active Resend API key to deliver verification emails.',
        message: 'Email service unconfigured'
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject: `${otp} is your DukaanOS Store Verification Code`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DukaanOS Verification</title>
              </head>
              <body style="margin: 0; padding: 30px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111214;">
                <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #000000; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                  <div style="display: flex; align-items: center; margin-bottom: 24px;">
                    <div style="background: #111214; color: #ffffff; width: 40px; height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; margin-right: 12px; text-align: center; line-height: 40px;">D</div>
                    <span style="font-size: 20px; font-weight: 800; color: #111214; letter-spacing: -0.5px;">DukaanOS</span>
                  </div>
                  
                  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px; color: #111214;">Verify your store account</h1>
                  <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px;">
                    Welcome to DukaanOS. Use the single-use verification code below to complete setting up your store <strong>${storeDisplayName}</strong>:
                  </p>

                  <div style="background: #f4f5f7; border: 2px solid #000000; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0;">
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #111214; font-family: monospace;">${otp}</div>
                    <div style="font-size: 12px; color: #71717a; margin-top: 8px; font-weight: 600;">Valid for 10 minutes</div>
                  </div>

                  <p style="font-size: 13px; color: #71717a; line-height: 1.5; margin: 0;">
                    If you did not request this verification code, please disregard this email. Your store security remains intact.
                  </p>

                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #71717a; text-align: center;">
                    DukaanOS • Retail Management for Independent Stores
                  </div>
                </div>
              </body>
            </html>
          `
        })
      });

      const data = await response.json() as any;
      if (!response.ok) {
        console.error('Resend delivery error:', data);
        return {
          success: false,
          error: data?.message || 'Email delivery failed. Please verify your email address.',
          message: 'Resend delivery rejected'
        };
      }

      console.log('✅ Email successfully delivered via Resend API to:', toEmail);
      return {
        success: true,
        message: `Verification code successfully sent to ${toEmail}. Please check your inbox and spam folder.`
      };
    } catch (err: any) {
      console.error('Failed to communicate with Resend API:', err.message);
      return {
        success: false,
        error: `Network error connecting to email provider: ${err.message}`,
        message: 'Network offline'
      };
    }
  }
}

export const emailService = new EmailService();

