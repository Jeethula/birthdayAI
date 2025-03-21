import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendBirthdayEmailParams {
  to: string;
  name: string;
  posterUrl: string;
}

const FALLBACK_IMAGE = 'https://picsum.photos/300/300';

export async function sendBirthdayEmail({ to, name, posterUrl }: SendBirthdayEmailParams) {
  try {
    let imageUrl: string;
    let message: string;

    try {
      const posterData = JSON.parse(posterUrl);
      imageUrl = posterData.imageUrl || FALLBACK_IMAGE;
      message = posterData.message;
    } catch (error) {
      console.error('Error parsing poster data:', error);
      imageUrl = FALLBACK_IMAGE;
      message = `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`;
    }

    const { data, error } = await resend.emails.send({
      from: 'Birthday AI <birthday@resend.dev>',
      to: [to],
      subject: `🎉 Happy Birthday ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Happy Birthday ${name}!</h1>
          <div style="text-align: center; margin: 20px 0;">
            <img 
              src="${imageUrl}" 
              alt="Birthday Poster" 
              style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
              onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';"
            />
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #444; font-size: 18px; line-height: 1.6; white-space: pre-line; text-align: center; margin: 0;">
              ${message}
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>This is an automated birthday message from Birthday AI</p>
          </div>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}