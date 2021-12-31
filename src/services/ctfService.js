const knex = require('../knex/knex')
const tableName = 'ctfs'

module.exports = {
  async getCtfs(q) {
    return knex(tableName)
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(q)
  },
  async getCtfById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
