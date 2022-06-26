const userService = require('../services/userService');
const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'client-controller', path: 'client' })

exports.signIn = async (req, res) => {
  try {
    const data = await userService.signIn(req.body)
    res.json(data)
  } catch (e) {
    logger.error(`Something went wrong while sign in => ${e}`)
    return res.status(500).json({
      message: 'something-went-wrong',
      status: 500
    })
  }
}

exports.signUp = async (req, res) => {
  try {
    const { email, password } = req.body

    // if (!email || !password)

    const data = await userService.signUp(req.body)
    return res.json(data)
  } catch (e) {
    logger.error(`Something went wrong while sign up => ${e}`)
    return res.status(500).json({
      message: 'something-went-wrong',
      status: 500
    })
  }
}
