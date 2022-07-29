require('dotenv').config()
const moment = require('moment')
const seedrandom = require('seedrandom')

const userRepository = require('../repositories/userRepository');
const bookmarksRepository = require('../repositories/bookmarkRepository');
const postTypeRepository = require('../repositories/postTypeRepository');
const cryptoService = require('./cryptoService');
const emailService = require('./emailService');
const jwtService = require('./jwtService')

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'user-service', path: 'user' });

const ApiError = require('../exceptions/apiError');
const { verifyTwoFa } = require('../common/verifyTwoFa')

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
    try {
      return await userRepository.getUserByPersonalId({ personalId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by personal ID: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  getUserSecuritySettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      const userSecuritySettings = await userRepository.getUserSecuritySettings({ id }, { transaction })
      userSecuritySettings.phone = userSecuritySettings.phone !== null
      userSecuritySettings.twoFa = userSecuritySettings.twoFa !== null
      userSecuritySettings.changedPasswordAt = moment(userSecuritySettings.changedPasswordAt) >= moment().subtract(2, 'days')

      return userSecuritySettings
    } catch (e) {
      logger.error(`Error while getting user settings: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  getUserPersonalSettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserPersonalSettings({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user personal settings: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  confirmAccount: async ({ activationLink }, { transaction } = { transaction: null }) => {
    const user = await userRepository.getUser({ activationLink }, { transaction })

    if (!user) throw ApiError.BadRequest()

    await userRepository.confirmAccount({ userId: user.id }, { transaction })

    return { status: 1 }
  },
  updateUserPersonalInformation: async ({ information, userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.updateUserPersonalInformation({ information, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while updating user personal information: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  changePassword: async ({ id, password, newPassword, newPasswordRepeat, twoFa }, { transaction } = { transaction: null }) => {

    const decryptedUserId = cryptoService.decrypt(id)
    const user = await userRepository.getUser({
      id: decryptedUserId
    })

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
      id: decryptedUserId,
      changePasswordAt: moment(),
      newPassword: cryptoService.hashPassword(newPassword)
    }, { transaction })
    logger.info(`Password has been successfully changed for user with email ${user.email}`)

    return { status: 1 }
  },
  deleteAccount: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.deleteAccount({ id }, { transaction })
    } catch (e) {
      logger.error(`Error white deleting account: ${e.message}`)
      throw Error('error-while-deleting-account')
    }
  },
  setTwoFa: async ({ twoFaToken, userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.setTwoFa({ twoFaToken, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while setting 2FA: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  disableTwoFa: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.disableTwoFa({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while disabling 2FA: ${e.message}`)
      throw Error('error-while-disabling-2fa')
    }
  },
  setMobilePhone: async({ phone, userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.setMobilePhone({ phone, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while setting mobile phone: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  disableMobilePhone: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.disableMobilePhone({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while disabling mobile phone: ${e.message}`)
      throw Error('error-while-disabling-mobile-phone')
    }
  },
  getLastValidSmsCode: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getLastValidSmsCode({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting last valid sms code: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  addCode: async ({ userId, code }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.addCode({ userId, code }, { transaction })
    } catch (e) {
      logger.error(`Error while adding sms code: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  addBookmark: async ({ id, type, userId, postTitle, postSlug }, { transaction } = { transaction: null }) => {
    try {
      const postType = await postTypeRepository.getPostTypeIdByType({ type }, { transaction })
      return await bookmarksRepository.addBookmark({
        post_id: id,
        post_type_id: postType.id,
        user_id: userId,
        post_title: postTitle,
        post_slug: postSlug
      }, { transaction })
    } catch (e) {
      logger.error(`Error while adding bookmark: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  getBookmarks: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await bookmarksRepository.getBookmarks({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting bookmark: ${e.message}`)
      throw ApiError.BadRequest()
    }
  },
  deleteBookmark: async ({ id, userId }, { transaction } = { transaction: null }) => {
    try {
      return await bookmarksRepository.deleteBookmark({ id, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while deleting bookmark: ${e.message}`)
      throw ApiError.BadRequest()
    }
  }
}
