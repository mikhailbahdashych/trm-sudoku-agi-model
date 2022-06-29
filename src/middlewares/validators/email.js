const v = require('express-validator')

module.exports = async (req) => {
  await v.check("email").isEmail().run(req)
}
