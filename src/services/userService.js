const knex = require('../knex/knex');
const tableName = 'users'

exports.getUserByEmail = async (email) => {
  return knex(tableName)
    .where('email', email)
    .first()
}

exports.getClientToSignIn = async (data) => {
  return knex(tableName)
    .where('email', data.email)
    .andWhere('password', data.password)
    .first()
}

exports.createUser = async (data) => {
  return knex(tableName).insert({
    email: data.email,
    password: data.password,
    personal_id: data.personalId
  })
}
