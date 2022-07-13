const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  getUserById: async ({ id }, { transaction } = { transaction: null }) => {
    console.log(id)
    const result = knex(tableName)
      .where('users.id', id)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .first(
        'personal_id as personalId',
        'two_fa as twoFa',
        'users_info.username as username',
        'users.id as id',
        'users.password as password',
        'email'
      )
    console.log('result', result)
    return transaction ? result.transacting(transaction) : result
  },
  getUserByEmail: async ({ email }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('email', email)
      .first()
    return transaction ? result.transacting(transaction) : result
  },
  getUserByUsername: async ({ username }, { transaction } = { transaction: null }) => {
    const result = knex('users_info')
      .where('username', username)
      .first()
    return transaction ? result.transacting(transaction) : result
  },
  getUserByPersonalId: async ({ personalId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .where('users.personal_id', personalId)
      .first(
        'users_info.username as username'
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
      )
    return transaction ? result.transacting(transaction) : result
  },
  createUser: async ({ email, password, personalId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert({
      email: email,
      password: password,
      personal_id: personalId,
    }).returning('id')
    return transaction ? result.transacting(transaction) : result
  },
  createUserInfo: async ({ user_id, username, personalInformation }, { transaction } = { transaction: null }) => {
    const result = knex('users_info').insert({ user_id, username, ...personalInformation })
    return transaction ? result.transacting(transaction) : result
  },
  getUserSecuritySettings: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('users.id', id)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .first(
        'users_info.username',
        'users.two_fa as twoFa'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getUserPersonalSettings: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('users.id', id)
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .first(
        'users_info.username',
        'users_info.first_name',
        'users_info.last_name',
        'users_info.title',
        'users_info.company',
        'users_info.location',
        'users_info.about_me',
        'users_info.website_link',
        'users_info.twitter',
        'users_info.github'
      )
    return transaction ? result.transacting(transaction) : result
  },
  changePassword: async ({ id, newPassword }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .update({ password: newPassword })
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
