const aliases = {
  password: ['password', 'newPassword', 'newPasswordRepeat']
}

exports.v = fields => {
  return (req, res, next) => {
    for (const field of fields) {
      let hasAlias = false
      let validator = null

      Object.entries(aliases).forEach(item => {
        item[1].forEach(alias => {
          if (alias === field) {
            hasAlias = true
            validator = item[0]
          }
        })
      })

      if (req.body[field] || hasAlias) {
        const result = require(`./validators/${validator || field}`)(req.body[field])
        if (!result)
          return res.status(400).json({ message: 'bad-request', status: 400 })
      }
    }
    next()
  }
}
