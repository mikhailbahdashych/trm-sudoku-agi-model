const twoFactorService = require('node-2fa');
const dotenv = require('dotenv');
const seedrandom = require('seedrandom');
dotenv.config();

const userService = require('../services/userService');
const cryptoService = require('../services/cryptoService');
const jwtService = require('../services/jwtService');

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'client-controller', path: 'client' });

exports.signIn = async (req, res) => {
  try {
    let { email, password, twofa } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const client = await userService.getClientToSignIn({email, password})
    logger.info(`Sign in client with email: ${email}`)

    if (!client) {
      logger.info(`Wrong data while sign in for client with email: ${email}`)
      return res.status(401).json({ message: 'unauthorized', status: 401 })
    }

    if (client.twofa) {
      if (!twofa) return res.status(200).json({ twofa: true })

      const result2Fa = twoFactorService.verifyToken(client.twofa, twofa)
      if (!result2Fa) return res.status(403).json({ status: 403, message: 'access-forbidden' })
      if (result2Fa.delta !== 0) return res.status(403).json({ status: 403, message: 'access-forbidden' })
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
    let { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const user = await userService.getUserByEmail(email)
    logger.info(`Registration client with email: ${email}`)

    if (user) {
      logger.warning(`Client with email ${email} already exists`)
      return res.status(409).json({ message: 'conflict', status: 409 })
    }

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    await userService.createUser({ email, password, personalId })
    logger.info(`Client with email ${email} was created`)

    return res.status(200).json({ message: 'success', status: 200 })
  } catch (e) {
    logger.error(`Something went wrong while sign up => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
