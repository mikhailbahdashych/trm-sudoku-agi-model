const twoFactorService = require('node-2fa');
const dotenv = require('dotenv');
const seedrandom = require('seedrandom');
dotenv.config();

const userService = require('../services/userService');
const cryptoService = require('../services/cryptoService');
const jwtService = require('../services/jwtService');

const loggerInstance = require('../common/logger');
const { getClientByJwtToken } = require('../common/getClientByJwtToken')
const logger = loggerInstance({ label: 'client-controller', path: 'client' });

exports.signIn = async (req, res) => {
  try {
    let { email, password, twoFa } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const client = await userService.getClientToSignIn({email, password})
    logger.info(`Sign in client with email: ${email}`)

    if (!client) {
      logger.info(`Wrong data while sign in for client with email: ${email}`)
      return res.status(401).json({ message: 'unauthorized', status: -1 })
    }

    if (client.twoFa) {
      if (!twoFa) return res.status(200).json({ twoFa: true })

      const result2Fa = twoFactorService.verifyToken(client.twoFa, twoFa)
      if (!result2Fa) return res.status(403).json({ status: -2, message: 'access-forbidden' })
      if (result2Fa.delta !== 0) return res.status(403).json({ status: -2, message: 'access-forbidden' })
    }

    const uxd = cryptoService.encrypt(client.id, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())
    const token = jwtService.sign({ uxd });

    return res.status(200).json(token)
  } catch (e) {
    logger.error(`Something went wrong while sign in => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.signUp = async (req, res) => {
  try {
    let { email, password, username } = req.body

    if (!email || !password || !username)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const user = await userService.getUserByEmail({ email })
    logger.info(`Registration client with email: ${email}`)

    if (user) {
      logger.warning(`Client with email ${email} already exists`)
      return res.status(409).json({ message: 'conflict', status: -1 })
    }

    const pickedUsername = await userService.getUserByUsername(username)

    if (pickedUsername) {
      logger.warning(`Client with nickname - ${username} - already exists`)
      return res.status(409).json({ message: 'conflict', status: -2 })
    }

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    await userService.createUser({ email, password, personalId, username })
    logger.info(`Client with email ${email} was created`)

    return res.status(200).json({ message: 'success', status: 200 })
  } catch (e) {
    logger.error(`Something went wrong while sign up => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getUserByPersonalId = async (req, res) => {
  try {
    const { personalId } = req.params

    if (!personalId)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const client = await userService.getUserByPersonalId(personalId)

    if (!client)
      return res.status(403).json({ error: "not-found", status: 403 });

    return res.status(200).json(client)
  } catch (e) {
    logger.error(`Something went wrong while getting user by personal Id => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getUserSettings = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });

    const client = await getClientByJwtToken(req.headers.ato)

    if (client.message)
      return res.status(200).json({ status: -1 });

    const settings = await userService.getUserSettings(client.id)

    return res.status(200).json(settings)
  } catch (e) {
    logger.error(`Something went wrong while getting user settings => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getUserByToken = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });

    const client = await getClientByJwtToken(req.headers.ato)


    // @TODO Fix here with not message but something else ("invalid signature") and check for join error
    if (client.message)
      return res.status(200).json({ status: -1 });

    return res.status(200).json(client)
  } catch (e) {
    logger.error(`Something went wrong while getting user by token => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.updateUserPersonalInformation = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });
  } catch (e) {
    logger.error(`Something went wrong while updating user personal information => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.updateUserSecuritySettings = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });
  } catch (e) {
    logger.error(`Something went wrong while updating user security settings => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.changePassword = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });
  } catch (e) {
    logger.error(`Something went wrong while changing password => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
