const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_DOMAIN,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports = {
  async sendEmail(payload) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_DOMAIN,
        to: payload.email,
        subject: payload.title,
        text: payload.message
      }
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Email sent: ' + info.response)
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
}
