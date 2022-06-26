const userService = require('../services/userService');
const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'client-controller', path: 'client' })

exports.signIn = async (req, res) => {
  try {

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
    let { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'bad-request',
        status: 400
      })
    }

    const user = await userService.getUserByEmail(email)
    logger.info(`Registration client with email: ${email}`)

    if (user) {
      logger.warning(`Client with email ${email} already exists`)
      return res.status(409).json({
        message: 'conflict',
        status: 409
      })
    }

    // password =
  } catch (e) {
    logger.error(`Something went wrong while sign up => ${e}`)
    return res.status(500).json({
      message: 'something-went-wrong',
      status: 500
    })
  }
}
