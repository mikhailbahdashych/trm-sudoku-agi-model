exports.v = fields => {
  return (req, res, next) => {
    fields.forEach(field => {
      const result = require(`./validators/${field}`)(req.body[field])
      if (!result) return res.status(400).json({ message: 'bad-request', status: 400 })
      next()
    })
  }
}
