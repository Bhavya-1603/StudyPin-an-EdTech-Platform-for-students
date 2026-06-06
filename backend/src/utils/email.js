import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const { EMAIL_USER, EMAIL_PASS } = process.env

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('Email credentials are not configured. Forgot password emails will fail.')
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
})

export async function sendPasswordResetOtp(email, otp) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email transport is not configured')
  }

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'StudyPin Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h2 style="color: #0f6ecd;">StudyPin Password Reset</h2>
        <p>Use the following code to reset your password:</p>
        <p style="font-size: 1.5rem; font-weight: 700; letter-spacing: 0.1em; margin: 1rem 0;">${otp}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}
