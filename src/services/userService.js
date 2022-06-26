const knex = require('../knex/knex');
const tableName = 'users'

module.exports = {
  async getUserByEmail(email) {
    return knex(tableName)
      .where('email', email)
      .first()
  },
  async getClientToSignIn(data) {
    return knex(tableName)
      .where('email', data.email)
      .andWhere('password', data.password)
      .first()
  },
  async createUser(data) {
    return knex(tableName).insert({
      email: data.email,
      password: data.password,
      personal_id: data.personalId
    })
  }
}
