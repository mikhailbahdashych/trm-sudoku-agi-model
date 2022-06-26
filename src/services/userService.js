const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  async signIn(data) {
    return knex(tableName)
  },
  async signUp(data) {
    return knex(tableName)
  }
}
