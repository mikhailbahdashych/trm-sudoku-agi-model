const knex = require('../knex/knex');
const tableName = 'users'

exports.getUserById = async ({ id }) => {
  return knex(tableName)
    .where('users.id', id)
    .leftJoin('users_info', 'users_info.user_id', 'users.id')
    .first(
      'personal_id as personalId',
      'two_fa as twoFa',
      'users_info.username as username',
      'users.id as id'
    )
}

exports.getUserByEmail = async ({ email }) => {
  return knex(tableName)
    .where('email', email)
    .first()
}

exports.getUserByUsername = async (username) => {
  return knex('users_info')
    .where('username', username)
    .first()
}

exports.getUserByPersonalId = async (personalId) => {
  return knex(tableName)
    .leftJoin('users_info', 'users_info.user_id', 'users.id')
    .where('users.personal_id', personalId)
    .first(
      'users_info.username as username'
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
  const createUser = await knex(tableName).insert({
    email: data.email,
    password: data.password,
    personal_id: data.personalId,
  }).returning('id')
  return knex('users_info').insert({ user_id: createUser[0].id, username: data.username })
}

exports.getUserPersonalInformation = async (id) => {
  return knex(tableName)
}
