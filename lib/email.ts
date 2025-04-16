import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Type definitions for template elements
interface TemplateElement {
  type: string;
  text?: string;
  url?: string;
  fontSize?: string;
}

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

// Helper function to render template elements
function renderTemplateElements(elements: TemplateElement[]): string {
  return elements.map(element => {
    if (element.type === 'image' && element.url) {
      return `<img src="${encodeURI(element.url)}" alt="Celebration" style="display:block;max-width:100%;height:auto;border-radius:8px;margin:20px auto"/>`;
    }
    if (element.type === 'text' && element.text) {
      return `<div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0">
        <p style="margin:0;color:#444;font-size:${element.fontSize || '18px'};line-height:1.6;text-align:center">
          ${element.text}
        </p>
      </div>`;
    }
    return '';
  }).join('\n');
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
    const title = getEmailTitle(name, celebrations, isAdmin);

    // Try to parse template elements
    let contentSection = '';
    try {
      if (posterUrl.startsWith('[')) {
        const elements = JSON.parse(posterUrl) as TemplateElement[];
        if (Array.isArray(elements)) {
          contentSection = renderTemplateElements(elements);
        }
      } else {
        contentSection = posterUrl.startsWith('data:image')
          ? `<img src="${encodeURI(posterUrl)}" alt="Birthday Celebration" style="display:block;max-width:100%;height:auto;border-radius:8px;margin:0 auto"/>`
          : `<div style="background:#f5f5f5;padding:30px;border-radius:8px;margin:20px 0">
              <p style="margin:0;color:#444;font-size:18px;line-height:1.6;text-align:center">
                ${posterUrl}
              </p>
             </div>`;
      }
    } catch (e) {
      console.log('Error processing template elements:', e);
      contentSection = `<div style="background:#f5f5f5;padding:30px;border-radius:8px;margin:20px 0">
        <p style="margin:0;color:#444;font-size:18px;line-height:1.6;text-align:center">
          ${posterUrl}
        </p>
       </div>`;
    }

    const emailContent = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin:0;padding:0">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f8">
            <tr>
              <td align="center" style="padding:40px 0">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);font-family:Arial,sans-serif">
                  <tr>
                    <td align="center" style="padding:40px">
                      <h1 style="color:#333;margin:0 0 30px 0;font-size:24px">
                        ${title}
                      </h1>
                      
                      ${contentSection}
                      
                      <div style="margin-top:30px;text-align:center">
                        <p style="color:#666;margin:0 0 10px 0;font-size:16px">
                          ${isAdmin
                            ? "This is an automated notification from Birthday AI"
                            : "This message was created especially for you by Birthday AI"
                          }
                        </p>
                        <p style="color:#999;font-size:14px;margin:0">
                          Spreading joy, one celebration at a time 🎉
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    // In test mode, only send to verified email
    const testEmail = 'jeethupachi@gmail.com';
    
    // Log template/message details
    if (isAdmin) {
      console.log('Sending admin email with template:', {
        name,
        isAdmin,
        hasTemplate: posterUrl.startsWith('data:image'),
        isTemplateElements: posterUrl.startsWith('['),
        posterUrlLength: posterUrl.length,
        templateElementsPreview: posterUrl.startsWith('[') 
          ? JSON.parse(posterUrl).map((el: TemplateElement) => ({ 
              type: el.type, 
              hasText: !!el.text, 
              hasUrl: !!el.url 
            }))
          : null,
        celebrations
      });
    }
    
    const { data, error } = await resend.emails.send({
      from: 'Birthday AI <onboarding@resend.dev>',
      to: [testEmail],  // Always send to test email in development
      subject: isAdmin ? getAdminSubject(name, celebrations) : getCelebrationSubject(name, celebrations),
      html: emailContent,
    });

    // Log email status
    console.log('Email sent:', {
      to: testEmail,
      originalRecipient: to,
      isAdmin,
      success: !error,
      error: error ? error.message : null
    });

    // Log original intended recipient for debugging
    if (to !== testEmail) {
      console.log(`Email would have been sent to: ${to} (sent to ${testEmail} in test mode)`);
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}