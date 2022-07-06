const seedrandom = require("seedrandom");
const knex = require('../knex/knex');
const dotenv = require("dotenv");
dotenv.config();

const userService = require("../services/userService");
const cryptoService = require("../services/cryptoService");
const jwtService = require("../services/jwtService");
const { validatePassword, validateEmail, validateUserPersonalId } = require("../common/validators");

const loggerInstance = require("../common/logger");
const { getClientByJwtToken } = require("../common/getClientByJwtToken")
const { verifyTwoFa } = require("../common/verifyTwoFa")
const twoFactorService = require("node-2fa");
const logger = loggerInstance({ label: "client-controller", path: "client" });

exports.signIn = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, twoFa } = req.body
    let reopening = false

    if (!email || !password || !validateEmail(email) || !validatePassword(password))
      return res.status(400).json({ message: "bad-request", status: 400 })

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const client = await userService.getClientToSignIn({ email, password }, { transaction })
    logger.info(`Sign in client with email: ${email}`)

    if (!client) {
      logger.info(`Wrong data while sign in for client with email: ${email}`)
      return res.status(401).json({ message: "unauthorized", status: -1 })
    }

    if (client.email.slice(-4) === "_del") {
      logger.info(`User has closed account, reopening...`)
      await userService.reopenAccount({
        id: client.id,
        email: client.email.split("_del")[0],
        password: client.password.split("_del")[0]
        },{ transaction })
      reopening = true
    }

    if (client.twoFa) {
      if (!twoFa) return res.status(200).json({ twoFa: true })

      const twoFaResult = verifyTwoFa(client.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    const uxd = cryptoService.encrypt(client.id, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())
    const token = jwtService.sign({ uxd })
    logger.info(`Client ${client.email} has been successfully signed in!`)

    return res.status(200).json({ token, personalId: client.personalId, username: reopening ? client.username : null })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while sign in => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.signUp = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, username } = req.body

    if (!email || !password || !username || !validateEmail(email) || !validatePassword(password))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const user = await userService.getUserByEmail({ email })
    logger.info(`Registration client with email: ${email}`)

    if (user) {
      logger.warning(`Client with email ${email} already exists`)
      return res.status(409).json({ message: "conflict", status: -1 })
    }

    const pickedUsername = await userService.getUserByUsername({ username }, { transaction })

    if (pickedUsername) {
      logger.warning(`Client with nickname - ${username} - already exists`)
      return res.status(409).json({ message: "conflict", status: -2 })
    }

    password = cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString())
    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    await userService.createUser({ email, password, personalId, username }, { transaction })
    logger.info(`Client with email ${email} has been successfully created!`)

    return res.status(200).json({ message: "success", status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while sign up => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.changePassword = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.body.token, { transaction })
    if (typeof client === "string" || !client) return res.status(200).json({ status: -1 });

    const { currentPassword, newPassword, newPasswordRepeat, twoFa } = req.body

    if (
      !currentPassword ||
      !newPassword ||
      !newPasswordRepeat ||
      newPasswordRepeat !== newPassword ||
      !validatePassword(currentPassword) || !validatePassword(newPassword) || !validatePassword(newPasswordRepeat)
    )
      return res.status(400).json({ message: "bad-request", status: 400 })

    if (client.password !== cryptoService.hashPassword(currentPassword, process.env.CRYPTO_SALT.toString()))
      return res.status(401).json({ error: "unauthorized", status: -2 });

    if (client.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(client.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -3, message: "access-forbidden" })
    }

    if (currentPassword === newPassword)
      return res.status(409).json({ message: "conflict", status: -4 })

    await userService.changePassword({
      id: client.id,
      newPassword: cryptoService.hashPassword(newPassword, process.env.CRYPTO_SALT.toString())
    }, { transaction })
    logger.info(`Password has been successfully changed for user with email ${client.email}`)

    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while changing password => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.changeEmail = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.body.token, { transaction })
    if (typeof client === "string" || !client) return res.status(200).json({ status: -1 });

    const { newEmail, twoFa } = req.body

    if (!newEmail || !validateEmail(newEmail))
      return res.status(400).json({ message: "bad-request", status: 400 })

    if (client.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(client.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    logger.info(`Email has been successfully changed for user with email`)
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while changing email => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.closeAccount = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.body.token, { transaction })
    if (typeof client === "string" || !client) return res.status(200).json({ status: -1 });

    const { password, twoFa } = req.body

    if (client.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(client.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    if (client.password !== cryptoService.hashPassword(password, process.env.CRYPTO_SALT.toString()))
      return res.status(401).json({ error: "unauthorized", status: -3 });

    await userService.closeAccount({
      id: client.id,
      email: client.email,
      password: client.password
    }, { transaction })
    logger.info(`Account has been successfully close for user with email ${client.email}`)

    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while closing account => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.getUserByToken = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.headers.ato, { transaction })
    if (typeof client === "string" || !client) return res.status(200).json({ status: -1 });

    return res.status(200).json({ personalId: client.personalId, username: client.username })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting user by token => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.getUserByPersonalId = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { personalId } = req.params

    if (!personalId || !validateUserPersonalId(personalId))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const client = await userService.getUserByPersonalId({ personalId }, { transaction })

    if (!client)
      return res.status(403).json({ error: "not-found", status: 403 });

    return res.status(200).json(client)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting user by personal Id => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.getLastActivity = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { personalId } = req.params

    if (!personalId || !validateUserPersonalId(personalId))
      return res.status(400).json({ message: "bad-request", status: 400 })

    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting last activity => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.getUserSettings = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    if (!req.params.t || !['s', 'p', 'ss'].includes(req.params.t))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const client = await getClientByJwtToken(req.headers.ato, { transaction })
    if (typeof client === "string" || !client) return res.status(200).json({ status: -1 });

    switch (req.params.t) {
      case 's':
        try {
          const settings = await userService.getUserSettings({ id: client.id }, { transaction });
          settings.twoFa = settings.twoFa !== null
          return res.status(200).json(settings);
        } catch (e) {
          logger.error(`Something went wrong while getting user security settings => ${e}`)
          return res.status(500).json({ message: "something-went-wrong", status: 500 })
        }
      case 'p':
        try {
          const personalInformation = await userService.getUserPersonalSettings({ id: client.id }, { transaction })
          return res.status(200).json(personalInformation);
        } catch (e) {
          logger.error(`Something went wrong while getting user personal settings => ${e}`)
          return res.status(500).json({ message: "something-went-wrong", status: 500 })
        }
      case 'ss':
        try {
          return res.status(200).json({});
        } catch (e) {
          logger.error(`Something went wrong while getting user site settings => ${e}`)
          return res.status(500).json({ message: "something-went-wrong", status: 500 })
        }
    }
  } catch (e) {
    await transaction.rollback()
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.updateUserPersonalInformation = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    logger.info(`Personal settings has been successfully updated for user`)
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while updating user personal information => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}


exports.setTwoFa = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.body.token)
    if (typeof client === 'string' || !client) return res.status(200).json({ status: -1 });

    const { twoFaCode, twoFaToken } = req.body

    const resultTwoFa = twoFactorService.verifyToken(twoFaToken, twoFaCode);
    logger.info(`Setting 2FA for client with id: ${client.id}`)

    if (!resultTwoFa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (resultTwoFa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.setTwoFa({ twoFaToken, id: client.id }, { transaction })
    logger.info(`2FA was successfully created for client with id: ${ client.id }`)

    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while setting 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableTwoFa = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const client = await getClientByJwtToken(req.body.token)
    if (typeof client === 'string' || !client) return res.status(200).json({ status: -1 });

    const { twoFaCode } = req.body

    const result2Fa = twoFactorService.verifyToken(client.twoFa, twoFaCode)

    if (!result2Fa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (result2Fa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.disableTwoFa({ id: client.id }, { transaction })
    logger.info(`2FA was successfully disabled for client with id: ${client.id}`)

    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while disabling 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
