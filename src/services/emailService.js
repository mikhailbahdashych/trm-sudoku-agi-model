require('dotenv').config()
const nodemailer = require('nodemailer')

module.exports = {
  sendVerificationEmail: async ({ email, activationLink }) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    return await transporter.sendEmail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'PNB - Account activation',
      html: `${activationLink}`
    })
  }
}
