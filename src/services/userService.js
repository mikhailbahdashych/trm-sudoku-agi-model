const userRepository = require("../repositories/userRepository");

const loggerInstance = require("../common/logger");
const logger = loggerInstance({ label: "client-service", path: "client" });

module.exports = {
  getClientToSignIn: async ({ email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getClientToSignIn({ email, password }, { transaction })
    } catch (e) {
      logger.error(`Error while getting client to sign in: ${e.message}`)
      throw Error("error-while-getting-client-to-sign-in")
    }
  },
  getUserByEmail: async ({ email }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserByEmail({ email }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by email: ${e.message}`)
      throw Error("error-while-getting-user-by-email")
    }
  },
  getUserByUsername: async ({ username }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserByUsername({ username }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by username: ${e.message}`)
      throw Error("error-while-getting-user-by-username")
    }
  },
  getUserByPersonalId: async ({ personalId }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserByPersonalId({ personalId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user by personal ID: ${e.message}`)
      throw Error("error-while-getting-user-by-personal-id")
    }
  },
  getUserSettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserSettings({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user settings: ${e.message}`)
      throw Error("error-while-getting-user-settings")
    }
  },
  getUserPersonalSettings: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.getUserPersonalSettings({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user personal settings: ${e.message}`)
      throw Error("error-while-getting-user-personal-settings")
    }
  },
  createUser: async ({ email, password, personalId, username }, { transaction } = { transaction: null }) => {
    try {
      const createdUser = await userRepository.createUser({ email, password, personalId }, { transaction })
      return await userRepository.createUserInfo({
        user_id: createdUser[0].id, username
      })
    } catch (e) {
      logger.error(`Error while creating user: ${e.message}`)
      throw Error("error-while-creating-user")
    }
  },
  changePassword: async ({ id, newPassword }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.changePassword({ id, newPassword }, { transaction })
    } catch (e) {
      logger.error(`Error while changing password: ${e.message}`)
      throw Error("error-while-changing-password")
    }
  },
  closeAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.closeAccount({ id, email, password }, { transaction })
    } catch (e) {
      logger.error(`Error white closing account: ${e.message}`)
      throw Error("error-while-closing-account")
    }
  },
  reopenAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.reopenAccount({ id, email, password }, { transaction })
    } catch (e) {
      logger.error(`Error while reopening account: ${e.message}`)
      throw Error("error-while-reopening-account")
    }
  },
  setTwoFa: async ({ twoFaToken, id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.setTwoFa({ twoFaToken, id }, { transaction })
    } catch (e) {
      logger.error(`Error while setting 2FA: ${e.message}`)
      throw Error("error-while-setting-2fa")
    }
  },
  disableTwoFa: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await userRepository.disableTwoFa({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while disabling 2FA: ${e.message}`)
      throw Error("error-while-disabling-2fa")
    }
  }
}
