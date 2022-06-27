const knex = require('../knex/knex');
const tableName = 'users'

exports.getUserById = async ({ id }) => {
  return knex(tableName)
    .where('id', id)
    .first(
      'personal_id as personalId',
      'two_fa as twoFa',
      'nickname',
      'id'
    )
}

exports.getUserByEmail = async ({ email }) => {
  return knex(tableName)
    .where('email', email)
    .first()
}

exports.getUserByNickname = async (nickname) => {
  return knex(tableName)
    .where('nickname', nickname)
    .first()
}

exports.getUserByPersonalId = async (personalId) => {
  return knex(tableName)
    .where('personal_id', personalId)
    .first(
      'nickname'
    )
}

exports.getClientToSignIn = async (data) => {
  return knex(tableName)
    .where('email', data.email)
    .andWhere('password', data.password)
    .first(
      'personal_id as personalId',
      'two_fa as twoFa',
      'id',
    )
}

exports.createUser = async (data) => {
  return knex(tableName).insert({
    email: data.email,
    password: data.password,
    personal_id: data.personalId
  })
}
