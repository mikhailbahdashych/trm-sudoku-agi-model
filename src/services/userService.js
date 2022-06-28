const knex = require('../knex/knex');
const tableName = 'users'

exports.getUserById = async ({ id }) => {
  return knex(tableName)
    .where('id', id)
    .first(
      'personal_id as personalId',
      'two_fa as twoFa',
      'username',
      'id'
    )
}

exports.getUserByEmail = async ({ email }) => {
  return knex(tableName)
    .where('email', email)
    .first()
}

exports.getUserByUsername = async (username) => {
  return knex(tableName)
    .where('username', username)
    .first()
}

exports.getUserByPersonalId = async (personalId) => {
  return knex(tableName)
    .where('personal_id', personalId)
    .first(
      'username'
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
    personal_id: data.personalId,
    username: data.username
  })
}

exports.getUserSettings = async (id) => {
  return knex(tableName)
}
