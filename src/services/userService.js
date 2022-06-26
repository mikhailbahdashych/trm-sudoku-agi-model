const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  async getUserByEmail(email) {
    return knex(tableName)
      .where('email', email)
      .first()
  },
  async createUser(data) {
    return knex(tableName).insert(data)
  }
}
