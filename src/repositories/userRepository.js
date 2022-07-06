const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  getUserById: async ({ id }, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
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
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getUserByEmail: async ({ email }, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('email', email)
        .first()
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getUserByUsername: async (username, { transaction = null } = {}) => {
    try {
      return await knex('users_info')
        .where('username', username)
        .first()
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getUserByPersonalId: async (personalId, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .leftJoin('users_info', 'users_info.user_id', 'users.id')
        .where('users.personal_id', personalId)
        .first(
          'users_info.username as username'
        )
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getClientToSignIn: async (data, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('email', data.email)
        .andWhere('password', data.password)
        .orWhere('email', data.email + '_del')
        .andWhere('password', data.password + '_del')
        .leftJoin('users_info', 'users_info.user_id', 'users.id')
        .first(
          'personal_id as personalId',
          'two_fa as twoFa',
          'password',
          'username',
          'email',
          'users.id as id',
        )
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  createUser: async (data, { transaction = null } = {}) => {
    try {
      // @TODO Fix here by making 2 requests + fix transactions
      const createUser = await knex(tableName).insert({
        email: data.email,
        password: data.password,
        personal_id: data.personalId,
      }).returning('id')
      return await knex('users_info').insert({ user_id: createUser[0].id, username: data.username })
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getUserSettings: async (userId, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('id', userId)
        .first('two_fa as twoFa')
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  getUserPersonalSettings: async (userId, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('users.id', userId)
        .leftJoin('users_info', 'users_info.user_id', 'users.id')
        .first(
          'users_info.username as username',
          'users_info.title as title',
          'users_info.location as location',
          'users_info.about_me as aboutMe',
          'users_info.website_link as websiteLink',
          'users_info.twitter as twitter',
          'users_info.github as github'
        )
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  changePassword: async (userId, newPassword, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('id', userId)
        .update({ password: newPassword })
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  closeAccount: async (userId, email, password, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('id', userId)
        .update({
          email: `${email}_del`,
          password: `${password}_del`
        })
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  reopenAccount: async (userId, email, password, { transaction = null } = {}) => {
    try {
      return await knex(tableName)
        .where('id', userId)
        .update({ email, password })
    } catch (e) {
      transaction.rollback()
      throw new Error(e)
    }
  },
  setTwoFa: async (tokenTwoFa, userId) => {
    return knex(tableName)
      .where('id', userId)
      .update({ two_fa: tokenTwoFa })
  },
  disableTwoFa: async (userId) => {
    return knex(tableName)
      .where('id', userId)
      .update({ two_fa: null })
  }
}
