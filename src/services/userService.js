const dotenv = require('dotenv')
const moment = require('moment')
dotenv.config()

const userRepository = require('../repositories/userRepository');
const bookmarksRepository = require('../repositories/bookmarkRepository');
const postTypeRepository = require('../repositories/postTypeRepository');
const cryptoService = require('./cryptoService');

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'user-service', path: 'user' });

module.exports = {
  getUserToSignIn: async ({ email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserToSignIn({
        email,
        password: cryptoService.hashPassword(password)
      }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user to sign in: ${e.message}`)
      throw Error('error-while-getting-user-to-sign-in')
    }
  },
  getUser: async ({ id, email, username }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUser({ id, email, username }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by id: ${e.message}`)
      throw Error('error-while-getting-user-by-id')
    }
  },
  getUserByPersonalId: async ({ personalId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserByPersonalId({ personalId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by personal ID: ${e.message}`)
      throw Error('error-while-getting-user-by-personal-id')
    }
  },
  getUserSecuritySettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      const userSecuritySettings = await userRepository.getUserSecuritySettings({ id }, { transaction })
      userSecuritySettings.twoFa = userSecuritySettings.twoFa !== null
      userSecuritySettings.changedPasswordAt = moment(userSecuritySettings.changedPasswordAt) >= moment().subtract(2, 'days')

      return userSecuritySettings
    } catch (e) {
      logger.error(`Error while getting user settings: ${e.message}`)
      throw Error('error-while-getting-user-settings')
    }
  },
  getUserPersonalSettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserPersonalSettings({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user personal settings: ${e.message}`)
      throw Error('error-while-getting-user-personal-settings')
    }
  },
  createUser: async ({ email, password, personalId, username, personalInformation }, { transaction } = { transaction: null }) => {
    try {
      const createdUser = await userRepository.createUser({
        email,
        password: cryptoService.hashPassword(password),
        personal_id: personalId
      }, { transaction })
      return await userRepository.createUserInfo({
        user_id: createdUser[0].id, username, ...personalInformation
      }, { transaction })
    } catch (e) {
      logger.error(`Error while creating user: ${e.message}`)
      throw Error('error-while-creating-user')
    }
  },
  updateUserPersonalInformation: async ({ information, userId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.updateUserPersonalInformation({ information, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while updating user personal information: ${e.message}`)
      throw Error('error-while-updating-user-personal-information')
    }
  },
  changePassword: async ({ id, newPassword }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.changePassword({
        id,
        changePasswordAt: moment(),
        newPassword: cryptoService.hashPassword(newPassword)
      }, { transaction })
    } catch (e) {
      logger.error(`Error while changing password: ${e.message}`)
      throw Error('error-while-changing-password')
    }
  },
  deleteAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.deleteAccount({ id, email, password }, { transaction })
    } catch (e) {
      logger.error(`Error white deleting account: ${e.message}`)
      throw Error('error-while-deleting-account')
    }
  },
  reopenAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.reopenAccount({ id, email, password }, { transaction })
    } catch (e) {
      logger.error(`Error while reopening account: ${e.message}`)
      throw Error('error-while-reopening-account')
    }
  },
  setTwoFa: async ({ twoFaToken, id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.setTwoFa({ twoFaToken, id }, { transaction })
    } catch (e) {
      logger.error(`Error while setting 2FA: ${e.message}`)
      throw Error('error-while-setting-2fa')
    }
  },
  disableTwoFa: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.disableTwoFa({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while disabling 2FA: ${e.message}`)
      throw Error('error-while-disabling-2fa')
    }
  },
  addBookmark: async ({ id, type, userId }, { transaction } = { transaction: null }) => {
    try {
      const postType = await postTypeRepository.getPostTypeIdByType({ type }, { transaction })
      return await bookmarksRepository.addBookmark({ post_id: id, post_type_id: postType.id, user_id: userId }, { transaction })
    } catch (e) {
      logger.error(`Error while adding bookmark: ${e.message}`)
      throw Error('error-while-adding-bookmark')
    }
  },
  getBookmarks: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await bookmarksRepository.getBookmarks({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while adding bookmark: ${e.message}`)
      throw Error('error-while-adding-bookmark')
    }
  }
}
