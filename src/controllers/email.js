const emailService = require('../services/emailService')

exports.sendEmail = async (req, res) => {
  const data = await emailService.sendEmail(req.body)
  res.json(data)
}
