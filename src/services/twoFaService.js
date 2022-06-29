const knex = require('../knex/knex');
const tableName = 'users'

exports.setTwoFa = async (tokenTwoFa, userId) => {
  return knex(tableName)
    .where('id', userId)
    .update({ two_fa: tokenTwoFa })
}

exports.disableTwoFa = async (userId) => {
  return knex(tableName)
    .where('id', userId)
    .update({ two_fa: null })
}
