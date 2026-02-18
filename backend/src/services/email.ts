import nodemailer from 'nodemailer';

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'labradordarts23@gmail.com';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('Email not configured: SMTP_USER and SMTP_PASS env vars required');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

const SUBJECT_LABELS: Record<string, string> = {
  membership: 'Membership Inquiry',
  tournament: 'Tournament Information',
  sponsorship: 'Sponsorship',
  general: 'General Question',
  other: 'Other',
};

export async function sendContactNotification(submission: {
  name: string;
  email: string;
  data: { subject?: string; message?: string };
}) {
  const t = getTransporter();
  if (!t) return;

  const subjectLabel = SUBJECT_LABELS[submission.data.subject || ''] || submission.data.subject || 'Contact Form';

  try {
    await t.sendMail({
      from: `"LDA Website" <${SMTP_USER}>`,
      to: CONTACT_EMAIL,
      replyTo: submission.email,
      subject: `[LDA Contact] ${subjectLabel} — ${submission.name}`,
      text: [
        `New contact form submission from the LDA website`,
        ``,
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Subject: ${subjectLabel}`,
        ``,
        `Message:`,
        submission.data.message || '(no message)',
        ``,
        `---`,
        `Reply directly to this email to respond to ${submission.name}.`,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #065f46; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">New Contact Form Submission</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 80px;">Name:</td>
                <td style="padding: 8px 0; font-weight: 600;">${submission.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${submission.email}">${submission.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Subject:</td>
                <td style="padding: 8px 0;">${subjectLabel}</td>
              </tr>
            </table>
            <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-top: 8px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${(submission.data.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #9ca3af;">Reply directly to this email to respond to ${submission.name}.</p>
          </div>
        </div>
      `,
    });
    console.log(`Contact notification sent to ${CONTACT_EMAIL}`);
  } catch (error) {
    console.error('Failed to send contact notification email:', error);
  }
}

export async function sendFormNotification(submission: {
  formType: string;
  name: string;
  email: string;
  data: any;
}) {
  const t = getTransporter();
  if (!t) return;

  const typeLabels: Record<string, string> = {
    registration: 'Player Registration',
    protest_appeal: 'Protest / Appeal',
    club_affiliation: 'Club Affiliation',
    contact: 'Contact',
  };
  const label = typeLabels[submission.formType] || submission.formType;

  try {
    await t.sendMail({
      from: `"LDA Website" <${SMTP_USER}>`,
      to: CONTACT_EMAIL,
      replyTo: submission.email,
      subject: `[LDA ${label}] New submission from ${submission.name}`,
      text: [
        `New ${label} form submission from the LDA website`,
        ``,
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Form Type: ${label}`,
        ``,
        `Data:`,
        JSON.stringify(submission.data, null, 2),
        ``,
        `---`,
        `View and manage this submission in the LDA admin panel.`,
      ].join('\n'),
    });
    console.log(`Form notification (${submission.formType}) sent to ${CONTACT_EMAIL}`);
  } catch (error) {
    console.error('Failed to send form notification email:', error);
  }
}
