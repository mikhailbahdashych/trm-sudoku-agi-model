const validator = require('express-validator')

module.exports = (fields) => {
  return async (req, res, next) => {
    for (const field of fields) {
      await require(`./validators/${field}`)(req);
    }
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
}

