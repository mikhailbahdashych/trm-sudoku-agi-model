const dotenv = require('dotenv')
dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountPhone = process.env.TWILIO_AUTH_PHONE;

const twilio = require('twilio')(accountSid, authToken);

module.exports = {
  sendSmsCode: async ({ phone, code }) => {
    return twilio.messages.create({
      body: `PNB: Verification code - ${code}. Code will be valid for 2 minutes.`,
      from: accountPhone,
      to: phone
    })
  }
}
