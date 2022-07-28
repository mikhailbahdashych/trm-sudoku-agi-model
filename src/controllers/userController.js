const seedrandom = require('seedrandom');
const moment = require('moment');
const knex = require('../knex/knex');
const dotenv = require('dotenv');
dotenv.config();

const userService = require('../services/userService');
const cryptoService = require('../services/cryptoService');
const jwtService = require('../services/jwtService');
const blogService = require('../services/blogService');
const questionsService = require('../services/qaService');
const forumService = require('../services/forumService');
const smsService = require('../services/smsSerivce');

const loggerInstance = require('../common/logger');
const { verifyTwoFa } = require('../common/verifyTwoFa')
const twoFactorService = require('node-2fa');
const logger = loggerInstance({ label: 'user-controller', path: 'user' });

exports.signIn = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, twoFa, phone } = req.body
    let reopening = false

    const user = await userService.getUserToSignIn({ email, password }, { transaction })
    logger.info(`Sign in user with email: ${email}`)

    if (!user) {
      logger.info(`Wrong data while sign in for user with email: ${email}`)
      return res.status(401).json({ message: 'unauthorized', status: -1 })
    }

    if (user.email.slice(-4) === '_del') {
      logger.info(`User has deleted account, reopening...`)
      await userService.reopenAccount({
        id: user.id,
        email: user.email.split('_del')[0],
        password: user.password.split('_del')[0]
        },{ transaction })
      reopening = true
    }

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: 'access-forbidden' })
    }

    const { refreshToken, accessToken } = await jwtService.updateTokens({
      userId: user.id,
      username: user.username,
      personalId: user.personalId,
      reputation: user.reputation
    }, { transaction })
    logger.info(`User ${user.email} has been successfully signed in!`)

    await transaction.commit()
    return res
      .status(200)
      .json({ _at: accessToken, _rt: refreshToken, reopening: reopening ? user.username : null })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while sign in : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.signUp = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    let { email, password, username, personalInformation } = req.body

    const sameEmailUser = await userService.getUser({ email }, { transaction })
    logger.info(`Registration user with email: ${email}`)

    if (sameEmailUser) {
      logger.warn(`User with email ${email} already exists`)
      return res.status(409).json({ message: 'conflict', status: -1 })
    }

    const sameUsernameUser = await userService.getUser({ username }, { transaction })

    if (sameUsernameUser) {
      logger.warn(`User with nickname - ${username} - already exists`)
      return res.status(409).json({ message: 'conflict', status: -2 })
    }

    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    await userService.createUser({ email, password, personalId, username, personalInformation }, { transaction })
    logger.info(`User with email ${email} has been successfully created!`)

    await transaction.commit()
    return res.status(200).json({ message: 'success', status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while sign up : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.changePassword = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { password, newPassword, newPasswordRepeat, twoFa } = req.body

    if (newPasswordRepeat !== newPassword) return res.status(400).json({ message: 'bad-request', status: 400 })
    if (user.password !== cryptoService.hashPassword(password)) return res.status(401).json({ error: 'unauthorized', status: -2 });
    if (password === newPassword) return res.status(409).json({ message: 'conflict', status: -4 })

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -3, message: 'access-forbidden' })
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
    logger.error(`Something went wrong while changing password : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.changeEmail = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { email, twoFa } = req.body

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: 'access-forbidden' })
    }

    if (user.changedEmail) return res.status(200).json({ status: -1 })

    logger.info(`Email has been successfully changed for user with email`)

    await transaction.commit()
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while changing email : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.deleteAccount = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { password, twoFa } = req.body

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) return res.status(403).json({ status: -2, message: 'access-forbidden' })
    }

    if (user.password !== cryptoService.hashPassword(password)) return res.status(401).json({ error: 'unauthorized', status: -3 });

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
    logger.error(`Something went wrong while deleting account : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.refreshToken = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const _rt = req.cookies['_rt'];

    const payload = jwtService.verifyToken({ token: _rt })

    if (payload.type !== 'refresh')
      return res.status(401).json({ message: 'unauthorized', status: 401 })

    const token = await jwtService.getTokenByTokenId({ tokenId: payload.id }, { transaction })
    const user = await userService.getUser({
      id: cryptoService.decrypt(token.userId)
    }, { transaction })

    if (!token) return res.status(401).json({ message: 'unauthorized', status: 401 })

    const tokens = await jwtService.updateTokens({
      userId: cryptoService.decrypt(token.userId),
      username: user.username,
      personalId: user.personalId,
      reputation: user.reputation
    }, { transaction })

    await transaction.commit()
    return res.status(200).json({ _at: tokens.accessToken, _rt: tokens.refreshToken })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while token refreshing : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getUserByPersonalId = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { personalId } = req.params

    const user = await userService.getUserByPersonalId({ personalId }, { transaction })
    delete user.id

    if (!user) return res.status(403).json({ error: 'not-found', status: 403 });

    await transaction.commit()
    return res.status(200).json(user)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting user by personal Id : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getUserSettings = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { t } = req.params

    if (!t || !['security', 'personal', 'notifications'].includes(t)) return res.status(400).json({ message: 'bad-request', status: 400 })

    switch (t) {
      case 'security':
        const securitySettings = await userService.getUserSecuritySettings({ id: user.id }, { transaction });

        await transaction.commit();
        return res.status(200).json(securitySettings);
      case 'personal':
        const personalSettings = await userService.getUserPersonalSettings({ id: user.id }, { transaction });

        await transaction.commit();
        return res.status(200).json(personalSettings);
      case 'notifications':
        break
    }
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting user's settings : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.updateUserPersonalInformation = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    await userService.updateUserPersonalInformation({
      information: req.body,
      userId: user.id
    }, { transaction })

    logger.info(`Personal settings has been successfully updated for user`)
    await transaction.commit()
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while updating user personal information : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.setTwoFa = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { twoFaCode, twoFaToken } = req.body
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const resultTwoFa = twoFactorService.verifyToken(twoFaToken, twoFaCode);
    logger.info(`Setting 2FA for user with id: ${user.id}`)

    if (!resultTwoFa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (resultTwoFa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.setTwoFa({ twoFaToken, userId: user.id }, { transaction })
    logger.info(`2FA was successfully created for user with id: ${ user.id }`)

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while setting 2FA : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableTwoFa = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { twoFa } = req.body

    const result2Fa = twoFactorService.verifyToken(user.twoFa, twoFa)

    if (!result2Fa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (result2Fa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await userService.disableTwoFa({ userId: user.id }, { transaction })
    logger.info(`2FA was successfully disabled for user with id: ${user.id}`)

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while disabling 2FA : ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.setMobilePhone = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { phone, twoFa } = req.body

    if (!twoFa) return res.status(200).json({ status: 0 })

    const code = (seedrandom(Date.now()).quick() * 1e6).toFixed(0)
    await smsService.sendSmsCode({ phone, code })
    await userService.addCode({ userId: user.id, code })

    const validSms = await userService.getLastValidSmsCode({ userId: user.id })

    if (validSms !== twoFa) return res.status(200).json({ status: -1 })

    await userService.setMobilePhone({ phone, userId: user.id })

    await transaction.commit()
    return res.status(200).json({ status: 1 });
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while setting mobile phone: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableMobilePhone = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { twoFa } = req.body

    await userService.disableMobilePhone({ userId: user.id })

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while disabling mobile phone: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.addBookmark = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { type, id } = req.body
    let post

    switch (type) {
      case 'blog':
        post = await blogService.getBlogPost({ id }, { transaction })
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      case 'forum':
        post = await forumService.getForumThread({ id }, { transaction })
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      case 'question':
        const { question } = await questionsService.getQuestion({ id }, { transaction })
        post = question
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      default:
        return res.status(400).json({ message: 'bad-request', status: 400 })
    }

    await userService.addBookmark({
      type,
      id,
      userId: user.id,
      postTitle: post.title,
      postSlug: post.slug
    })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while adding bookmark: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getBookmarks = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const bookmarks = await userService.getBookmarks({ userId: user.id }, { transaction })

    await transaction.commit()
    return res.status(200).json(bookmarks)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting bookmarks: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.deleteBookmark = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { id } = req.params

    await userService.deleteBookmark({ id, userId: user.id }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while deleting bookmark: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
