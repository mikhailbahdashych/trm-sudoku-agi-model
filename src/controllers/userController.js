const knex = require('../knex/knex');

const userService = require('../services/userService');
const jwtService = require('../services/jwtService');

exports.signIn = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { email, password, twoFa, phone } = req.body

    const result = await userService.signIn({ email, password, twoFa, phone }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.signUp = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { email, password, username, personalInformation } = req.body

    const result = await userService.signUp({ email, password, username, personalInformation }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.logout = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    await jwtService.deleteRefreshToken({ userId: req.user }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.confirmAccount = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { activationLink } = req.body

    const result = await userService.confirmAccount({ activationLink }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.changePassword = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { password, newPassword, newPasswordRepeat, twoFa } = req.body

    const result = await userService.changePassword({
      userId: req.user, password, newPassword, newPasswordRepeat, twoFa
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.changeEmail = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { email, twoFa } = req.body

    const result = await userService.changeEmail({
      userId: req.user, email, twoFa
    })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.deleteAccount = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { password, twoFa } = req.body

    const result = await userService.deleteAccount({
      userId: req.user, password, twoFa
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.refreshToken = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const _rt = req.cookies['_rt'];

    const result = await userService.refreshToken({ _rt }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getUserByPersonalId = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { personalId } = req.params

    const user = await userService.getUserByPersonalId({ personalId }, { transaction })

    await transaction.commit()
    return res.status(200).json(user)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getUserSettings = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { t } = req.params

    const result = await userService.getUserSettings({
      userId: req.user, type: t
    }, { transaction })

    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.updateUserPersonalInformation = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const information = req.body

    const result = await userService.updateUserPersonalInformation({
      information, userId: req.user
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.setTwoFa = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { twoFaCode, twoFaToken } = req.body

    const result = await userService.setTwoFa({
      twoFaCode, twoFaToken, userId: req.user
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.disableTwoFa = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { twoFa } = req.body

    const result = await userService.disableTwoFa({
      twoFa, userId: req.user
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.setMobilePhone = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { phone, twoFa } = req.body

    const result = await userService.setMobilePhone({
      phone, twoFa, userId: req.user
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.disableMobilePhone = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { twoFa } = req.body

    const result = await userService.disableMobilePhone({
      twoFa, userId: req.user
    })

    await transaction.commit()
    return res.status(200).json(result);
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
