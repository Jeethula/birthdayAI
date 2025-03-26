import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCelebrationEmailParams {
  to: string;
  name: string;
  posterUrl: string;
  isAdmin?: boolean;
  celebrations: {
    isBirthday: boolean;
    isWorkAnniversary: boolean;
  };
}

const FALLBACK_IMAGE = 'https://picsum.photos/300/300';

function getCelebrationSubject(name: string, celebrations: { isBirthday: boolean; isWorkAnniversary: boolean }): string {
  if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
    return `🎉 Happy Birthday & Work Anniversary ${name}!`;
  } else if (celebrations.isBirthday) {
    return `🎉 Happy Birthday ${name}!`;
  } else {
    return `🎉 Happy Work Anniversary ${name}!`;
  }
}

function getAdminSubject(name: string, celebrations: { isBirthday: boolean; isWorkAnniversary: boolean }): string {
  if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
    return `🎉 Today is ${name}'s Birthday & Work Anniversary!`;
  } else if (celebrations.isBirthday) {
    return `🎉 Today is ${name}'s Birthday!`;
  } else {
    return `🎉 Today is ${name}'s Work Anniversary!`;
  }
}

function getEmailTitle(name: string, celebrations: { isBirthday: boolean; isWorkAnniversary: boolean }, isAdmin: boolean): string {
  if (isAdmin) {
    return `Today we're celebrating ${name}!`;
  }
  if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
    return `Happy Birthday & Work Anniversary ${name}!`;
  }
  if (celebrations.isBirthday) {
    return `Happy Birthday ${name}!`;
  }
  return `Happy Work Anniversary ${name}!`;
}

function getFallbackMessage(name: string, celebrations: { isBirthday: boolean; isWorkAnniversary: boolean }, isAdmin: boolean): string {
  if (isAdmin) {
    if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
      return `Today is ${name}'s birthday and work anniversary!`;
    }
    return celebrations.isBirthday 
      ? `Today is ${name}'s birthday!` 
      : `Today is ${name}'s work anniversary!`;
  }
  
  if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
    return `Happy birthday and work anniversary, ${name}!\nWishing you a wonderful celebration of both special occasions!`;
  }
  return celebrations.isBirthday
    ? `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`
    : `Happy work anniversary, ${name}!\nThank you for your dedication and hard work!`;
}

export async function sendBirthdayEmail({ to, name, posterUrl, isAdmin = false, celebrations }: SendCelebrationEmailParams) {
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
      message = getFallbackMessage(name, celebrations, isAdmin);
    }

    const { data, error } = await resend.emails.send({
      from: 'Birthday AI <birthday@resend.dev>',
      to: [to],
      subject: isAdmin ? getAdminSubject(name, celebrations) : getCelebrationSubject(name, celebrations),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">${getEmailTitle(name, celebrations, isAdmin)}</h1>
          <div style="text-align: center; margin: 20px 0;">
            <img 
              src="${imageUrl}" 
              alt="Celebration Poster" 
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
            <p>This is an automated message from Birthday AI</p>
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