import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  workspaceName: string,
  role: string,
  token: string
): Promise<void> {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${inviterName} invited you to "${workspaceName}" on Scoreboard`,
    html: `
      <h2>You've been invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to join the workspace
         <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}" style="background:#1890ff;color:white;padding:12px 24px;
         border-radius:6px;text-decoration:none;display:inline-block;">
         Accept Invitation
      </a></p>
      <p>This link expires in 7 days.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your Scoreboard password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="background:#1890ff;color:white;padding:12px 24px;
         border-radius:6px;text-decoration:none;display:inline-block;">
         Reset Password
      </a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}
