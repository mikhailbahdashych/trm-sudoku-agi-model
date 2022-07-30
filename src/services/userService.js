require('dotenv').config()
const moment = require('moment')
const seedrandom = require('seedrandom')

const userRepository = require('../repositories/userRepository');
const cryptoService = require('./cryptoService');
const emailService = require('./emailService');
const smsService = require('./smsSerivce')
const jwtService = require('./jwtService')

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'user-service', path: 'user' });

const ApiError = require('../exceptions/apiError');
const { verifyTwoFa } = require('../common/verifyTwoFa')
const twoFactorService = require('node-2fa')

module.exports = {
  signIn: async ({ email, password, twoFa, phone }, { transaction } = { transaction: null }) => {
    let reopen = false
    logger.info(`Sign in user with email: ${email}`)

    const user = await userRepository.getUserToSignIn({
      email,
      password: cryptoService.hashPassword(password)
    }, { transaction })

    if (!user) {
      logger.info(`Wrong data while sign in for user with email: ${email}`)
      throw ApiError.UnauthorizedError({ statusCode: -1 })
    }

    if (user.closeAccount) {
      logger.info(`User has deleted account, reopening...`)
      await userRepository.reopenAccount({ id: user.id }, { transaction })
      reopen = true
    }

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) throw ApiError.AccessForbidden({ statusCode: -2 })
    }

    const { refreshToken, accessToken } = await jwtService.updateTokens({
      userId: user.id,
      username: user.username,
      personalId: user.personalId,
      reputation: user.reputation
    }, { transaction })
    logger.info(`User ${user.email} has been successfully signed in!`)

    return {
      _at: accessToken, _rt: refreshToken, reopening: reopen ? user.username : null
    }
  },
  signUp: async ({ email, password, username, personalInformation },  { transaction } = { transaction: null }) => {
    const sameEmailUser = await userRepository.getUser({ email }, { transaction })
    logger.info(`Registration user with email: ${email}`)

    if (sameEmailUser) {
      logger.warn(`User with email ${email} already exists`)
      throw ApiError.Conflict({ statusCode: -1 })
    }

    const sameUsernameUser = await userRepository.getUser({ username }, { transaction })

    if (sameUsernameUser) {
      logger.warn(`User with nickname - ${username} - already exists`)
      throw ApiError.Conflict({ statusCode: -2 })
    }

    const personalId = (seedrandom(email).quick() * 1e10).toFixed(0)
    const createdUser = await userRepository.createUser({
      email,
      password: cryptoService.hashPassword(password),
      personal_id: personalId
    }, { transaction })
    await userRepository.createUserInfo({
      user_id: createdUser[0].id, username, ...personalInformation
    }, { transaction })
    logger.info(`User with email ${email} has been successfully created!`)

    // const activationLink = ''
    // await emailService.sendVerificationEmail({ email, activationLink })
    // await userRepository.createConfirmationRequest({ userId: createdUser[0].user_id, activationLink }, { transaction })
    // logger.info(`Confirmation email has been successfully sent to user ${email}!`)

    return { message: 'success', statusCode: 1 }
  },
  getUser: async ({ id, email, username, activationLink }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUser({ id, email, username, activationLink }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by id: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  getUserByPersonalId: async ({ personalId }, { transaction } = { transaction: null }) => {
    const user = await userRepository.getUserByPersonalId({ personalId }, { transaction })

    if (!user) throw ApiError.BadRequest()

    return user
  },
  getUserSettings: async ({ userId, type }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const settingsType = ['security', 'personal', 'notifications']
    if (!type || !settingsType.includes(type)) throw ApiError.BadRequest()

    let settings
    switch (type) {
      case 'security':
        settings = await userRepository.getUserSecuritySettings({ id: user.id }, { transaction });

        if (!settings) throw ApiError.BadRequest()

        settings.phone = settings.phone !== null
        settings.twoFa = settings.twoFa !== null
        // @TODO Test it one more time
        settings.changedPasswordAt = moment(settings.changedPasswordAt) >= moment().subtract(2, 'days')

        break
      case 'personal':
        settings = await userRepository.getUserPersonalSettings({ id: user.id }, { transaction });

        if (!settings) throw ApiError.BadRequest()

        break
      case 'notifications':
        break
    }

    return settings
  },
  confirmAccount: async ({ activationLink }, { transaction } = { transaction: null }) => {
    const user = await userRepository.getUser({ activationLink }, { transaction })

    if (!user) throw ApiError.BadRequest()

    await userRepository.confirmAccount({ userId: user.id }, { transaction })

    return { status: 1 }
  },
  updateUserPersonalInformation: async ({ information, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    await userRepository.updateUserPersonalInformation({ information, userId: user.id }, { transaction })
    logger.info(`Personal settings has been successfully updated for user: ${user.email}`)

    return { statusCode: 1 }
  },
  changePassword: async ({ userId, password, newPassword, newPasswordRepeat, twoFa }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    if (newPassword !== newPasswordRepeat) throw ApiError.BadRequest()
    if (user.password !== cryptoService.hashPassword(password)) throw ApiError.UnauthorizedError({ statusCode: -2 })
    if (password === newPassword) throw ApiError.Conflict({ statusCode: -4 })

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) throw ApiError.AccessForbidden({ statusCode: -3 })
    }

    if (
      user.changedPasswordAt &&
      moment(user.changedPasswordAt).format('YYYY-MM-DD HH:mm:ss') >=
      moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss')
    ) {
      return { status: -5 }
    }

    await userRepository.changePassword({
      id: user.id,
      changePasswordAt: moment(),
      newPassword: cryptoService.hashPassword(newPassword)
    }, { transaction })
    logger.info(`Password has been successfully changed for user with email ${user.email}`)

    return { statusCode: 1 }
  },
  changeEmail: async ({ userId, email, twoFa }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) throw ApiError.AccessForbidden({ statusCode: -2 })
    }

    if (user.changedEmail) return { statusCode: -1 }

    await userRepository.changeEmail({
      id: user.id, email
    }, { transaction })
    logger.info(`Email has been successfully changed for user with email`)

    return { statusCode: 1 }
  },
  deleteAccount: async ({ userId, password, twoFa }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (user.twoFa) {
      const twoFaResult = verifyTwoFa(user.twoFa, twoFa)
      if (!twoFaResult) throw ApiError.AccessForbidden({ statusCode: -2 })
    }

    if (user.password !== cryptoService.hashPassword(password))  throw ApiError.UnauthorizedError({ statusCode: -3 })

    await userRepository.deleteAccount({
      id: user.id
    }, { transaction })
    logger.info(`Account has been successfully deleted for user with email ${user.email}`)

    return { statusCode: 1 }
  },
  refreshToken: async ({ _rt }, { transaction } = { transaction: null }) => {
    const payload = jwtService.verifyToken({ token: _rt })

    if (payload.type !== 'refresh') throw ApiError.UnauthorizedError()

    const token = await jwtService.getTokenByTokenId({ tokenId: payload.id }, { transaction })

    if (!token) throw ApiError.UnauthorizedError()

    const user = await userRepository.getUser({
      id: cryptoService.decrypt(token.userId)
    }, { transaction })

    const tokens = await jwtService.updateTokens({
      userId: cryptoService.decrypt(token.userId),
      username: user.username,
      personalId: user.personalId,
      reputation: user.reputation
    }, { transaction })

    return { _at: tokens.accessToken, _rt: tokens.refreshToken }
  },
  setTwoFa: async ({ twoFaCode, twoFaToken, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const resultTwoFa = twoFactorService.verifyToken(twoFaToken, twoFaCode);

    if (!resultTwoFa) throw ApiError.AccessForbidden({ statusCode: -1 })
    if (resultTwoFa.delta !== 0) throw ApiError.AccessForbidden({ statusCode: -1 })

    await userRepository.setTwoFa({ twoFaToken, userId: user.id }, { transaction })
    logger.info(`2FA was successfully created for user with id: ${ user.id }`)

    return { statusCode: 1 }
  },
  disableTwoFa: async ({ twoFa, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const result2Fa = twoFactorService.verifyToken(user.twoFa, twoFa)

    if (!result2Fa) throw ApiError.AccessForbidden({ statusCode: -1 })
    if (result2Fa.delta !== 0) throw ApiError.AccessForbidden({ statusCode: -1 })

    if (!user) throw ApiError.BadRequest()

    await userRepository.disableTwoFa({ userId: decryptedUserId }, { transaction });
    logger.info(`2FA was successfully disabled for user with id: ${user.id}`)

    return { statusCode: 1 }
  },
  setMobilePhone: async({ phone, userId, twoFa }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()
    if (!twoFa) return { statusCode: 0 }

    const code = (seedrandom(Date.now()).quick() * 1e6).toFixed(0)
    await smsService.sendSmsCode({ phone, code })
    await userRepository.addCode({ userId: user.id, code })

    const validSms = await userRepository.getLastValidSmsCode({ userId: user.id })

    if (validSms !== twoFa) return { statusCode: -1 }

    await userRepository.setMobilePhone({ phone, userId }, { transaction })
    return { statusCode: 1 }
  },
  disableMobilePhone: async ({ userId, twoFa }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!twoFa) {
      const validSms = await userRepository.getLastValidSmsCode({ userId: user.id })
      if (!validSms) {
        const code = (seedrandom(Date.now()).quick() * 1e6).toFixed(0)
        await smsService.sendSmsCode({ phone: user.phone, code })
        await userRepository.addCode({ userId: user.id, code })
        return { statusCode: 0 }
      }
    } else {
      const validSms = await userRepository.getLastValidSmsCode({ userId: user.id })
      if (!validSms || twoFa !== validSms) return { statusCode: 0 }
    }

    await userRepository.disableMobilePhone({ userId }, { transaction })
    return { statusCode: 1 }
  }
}
