const seedrandom = require("seedrandom");
const moment = require("moment");
const knex = require('../knex/knex');
const dotenv = require("dotenv");
dotenv.config();

const userService = require("../services/userService");
const cryptoService = require("../services/cryptoService");
const jwtService = require("../services/jwtService");
const { validatePassword, validateEmail, validateUserPersonalId } = require("../common/validators");

const loggerInstance = require("../common/logger");
const { verifyTwoFa } = require("../common/verifyTwoFa")
const twoFactorService = require("node-2fa");
const logger = loggerInstance({ label: "user-controller", path: "user" });

exports.signIn = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, twoFa } = req.body
    let reopening = false

    if (!email || !password || !validateEmail(email) || !validatePassword(password))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const user = await userService.getUserToSignIn({ email, password }, { transaction })
    logger.info(`Sign in user with email: ${email}`)

    if (!user) {
      logger.info(`Wrong data while sign in for user with email: ${email}`)
      return res.status(401).json({ message: "unauthorized", status: -1 })
    }

    if (user.email.slice(-4) === "_del") {
      logger.info(`User has deleted account, reopening...`)
      await userService.reopenAccount({
        id: user.id,
        email: user.email.split("_del")[0],
        password: user.password.split("_del")[0]
        },{ transaction })
      reopening = true
    }

    if (user.twoFa) {
      if (!twoFa) return res.status(200).json({ twoFa: true })

      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    const { refreshToken, accessToken } = await jwtService.updateTokens({
      userId: user.id, username: user.username, personalId: user.personalId
    }, { transaction })
    logger.info(`User ${user.email} has been successfully signed in!`)

    await transaction.commit()
    return res
      .status(200)
      .json({ _at: accessToken, _rt: refreshToken, reopening: reopening ? user.username : null })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while sign in => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.signUp = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, username, personalInformation } = req.body

    if (!email || !password || !username || !validateEmail(email) || !validatePassword(password))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const user = await userService.getUser({ email })
    logger.info(`Registration user with email: ${email}`)

    if (user) {
      logger.warn(`User with email ${email} already exists`)
      return res.status(409).json({ message: "conflict", status: -1 })
    }

    if (user.username === username) {
      logger.warn(`User with nickname - ${username} - already exists`)
      return res.status(409).json({ message: "conflict", status: -2 })
    }

    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    await userService.createUser({ email, password, personalId, username, personalInformation }, { transaction })
    logger.info(`User with email ${email} has been successfully created!`)

    await transaction.commit()
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
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const { currentPassword, newPassword, newPasswordRepeat, twoFa } = req.body

    if (
      !currentPassword ||
      !newPassword ||
      !newPasswordRepeat ||
      newPasswordRepeat !== newPassword ||
      !validatePassword(currentPassword) || !validatePassword(newPassword) || !validatePassword(newPasswordRepeat)
    )
      return res.status(400).json({ message: "bad-request", status: 400 })

    if (user.password !== cryptoService.hashPassword(currentPassword))
      return res.status(401).json({ error: "unauthorized", status: -2 });

    if (currentPassword === newPassword)
      return res.status(409).json({ message: "conflict", status: -4 })

    if (user.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -3, message: "access-forbidden" })
    }

    if (
      user.changedPasswordAt &&
      moment(user.changedPasswordAt).format('YYYY-MM-DD HH:mm:ss') >=
      moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss')
    ) {
      return res.status(200).json({ status: -5 })
    }

    await userService.changePassword({
      id: user.id, newPassword
    }, { transaction })
    logger.info(`Password has been successfully changed for user with email ${user.email}`)

    await transaction.commit()
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
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const { newEmail, twoFa } = req.body

    if (!newEmail || !validateEmail(newEmail))
      return res.status(400).json({ message: "bad-request", status: 400 })

    if (user.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    if (user.changedEmail)
      return res.status(200).json({ status: -1 })

    logger.info(`Email has been successfully changed for user with email`)

    await transaction.commit()
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while changing email => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.deleteAccount = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const { password, twoFa } = req.body

    if (user.twoFa) {
      if (!twoFa) return res.status(400).json({ message: "bad-request", status: 400 })

      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: "access-forbidden" })
    }

    if (user.password !== cryptoService.hashPassword(password))
      return res.status(401).json({ error: "unauthorized", status: -3 });

    await userService.deleteAccount({
      id: user.id,
      email: user.email,
      password: user.password
    }, { transaction })
    logger.info(`Account has been successfully deleted for user with email ${user.email}`)

    await transaction.commit()
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while deleting account => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.refreshToken = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const _rt = req.headers.cookie.split('=')[1]

    const payload = jwtService.verifyToken({ token: _rt })

    if (payload.type !== 'refresh')
      return res.status(401).json({ message: "unauthorized", status: 401 })

    const token = await jwtService.getTokenByTokenId({ tokenId: payload.id }, { transaction })
    const user = await userService.getUser({
      id: cryptoService.decrypt(token.userId)
    }, { transaction })

    if (!token)
      return res.status(401).json({ message: "unauthorized", status: 401 })

    const tokens = await jwtService.updateTokens({
      userId: cryptoService.decrypt(token.userId),
      username: user.username,
      personalId: user.personalId
    }, { transaction })

    await transaction.commit()
    return res.status(200).json({ _at: tokens.accessToken, _rt: tokens.refreshToken })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while token refreshing => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.getUserByPersonalId = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { personalId } = req.params

    if (!personalId || !validateUserPersonalId(personalId))
      return res.status(400).json({ message: "bad-request", status: 400 })

    const user = await userService.getUserByPersonalId({ personalId }, { transaction })

    if (!user)
      return res.status(403).json({ error: "not-found", status: 403 });

    await transaction.commit()
    return res.status(200).json(user)
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

    await transaction.commit()
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
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const { t } = req.params

    if (!t || !['security', 'personal', 'notifications'].includes(t))
      return res.status(400).json({ message: "bad-request", status: 400 })

    switch (t) {
      case 'security':
        const securitySettings = await userService.getUserSecuritySettings({ id: user.id }, { transaction });

        await transaction.commit();
        return res.status(200).json(securitySettings);
      case 'personal':
        const personalSettings = await userService.getUserByPersonalId({ personalId: user.personalId }, { transaction });

        await transaction.commit();
        return res.status(200).json(personalSettings);
      case 'notifications':
        break
    }
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting user's settings => ${e}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.updateUserPersonalInformation = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    logger.info(`Personal settings has been successfully updated for user`)
    await transaction.commit()
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
    const { twoFaCode, twoFaToken } = req.body
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const resultTwoFa = twoFactorService.verifyToken(twoFaToken, twoFaCode);
    logger.info(`Setting 2FA for user with id: ${user.id}`)

    if (!resultTwoFa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (resultTwoFa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.setTwoFa({ twoFaToken, id: user.id }, { transaction })
    logger.info(`2FA was successfully created for user with id: ${ user.id }`)

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while setting 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableTwoFa = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.headers.userId)
    }, { transaction })

    const { twoFaCode } = req.body

    const result2Fa = twoFactorService.verifyToken(user.twoFa, twoFaCode)

    if (!result2Fa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (result2Fa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.disableTwoFa({ id: user.id }, { transaction })
    logger.info(`2FA was successfully disabled for user with id: ${user.id}`)

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while disabling 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
