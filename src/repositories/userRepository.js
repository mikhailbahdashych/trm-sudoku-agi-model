const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  getUser: async ({ id, email, username }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .modify((x) => {
        if (id) x.where('users.id', id)
        else if (email) x.where('users.email', email)
        else if (username) x.where('users_info.username', username)
      })
      .first(
        'users.personal_id as personalId',
        'users.two_fa as twoFa',
        'users.id as id',
        'users.password',
        'users.email',
        'users.changed_email as changedEmail',
        'users.changed_password_at as changedPasswordAt',
        'users_info.reputation',
        'users_info.username'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getUserByPersonalId: async ({ personalId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .where('users.personal_id', personalId)
      .first(
        'users_info.reputation',
        'users.personal_id as personalId',
        'users_info.username',
        'users_info.first_name',
        'users_info.last_name',
        'users_info.status',
        'users_info.company',
        'users_info.location',
        'users_info.about_me',
        'users_info.website_link',
        'users_info.twitter',
        'users_info.github'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getUserToSignIn: async ({ email, password }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('email', email)
      .andWhere('password', password)
      .orWhere('email', email + '_del')
      .andWhere('password', password + '_del')
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .first(
        'personal_id as personalId',
        'two_fa as twoFa',
        'password',
        'username',
        'email',
        'users.id as id',
        'users_info.reputation'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getUserSecuritySettings: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .first(
        'two_fa as twoFa',
        'changed_email as changedEmail',
        'changed_password_at as changedPasswordAt'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getUserPersonalSettings: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex('users_info')
      .where('user_id', id)
      .first(
        'first_name',
        'last_name',
        'status',
        'company',
        'location',
        'about_me',
        'website_link',
        'twitter',
        'github',
        'show_email'
      )
    return transaction ? result.transacting(transaction) : result
  },
  createUser: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data).returning('id')
    return transaction ? result.transacting(transaction) : result
  },
  createUserInfo: async (data, { transaction } = { transaction: null }) => {
    const result = knex('users_info').insert(data)
    return transaction ? result.transacting(transaction) : result
  },
  updateUserPersonalInformation: async ({ information, userId }, { transaction } = { transaction: null }) => {
    const result = knex('users_info')
      .where('user_id', userId)
      .update({ ...information })
    return transaction ? result.transacting(transaction) : result
  },
  changePassword: async ({ id, newPassword, changePasswordAt }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({
        password: newPassword,
        changed_password_at: changePasswordAt
      })
    return transaction ? result.transacting(transaction) : result
  },
  deleteAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({
        email: `${email}_del`,
        password: `${password}_del`
      })
    return transaction ? result.transacting(transaction) : result
  },
  reopenAccount: async ({ id, email, password }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({ email, password })
    return transaction ? result.transacting(transaction) : result
  },
  setTwoFa: async ({ twoFaToken, id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({ two_fa: twoFaToken })
    return transaction ? result.transacting(transaction) : result

  },
  disableTwoFa: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({ two_fa: null })
    return transaction ? result.transacting(transaction) : result
  }
}
