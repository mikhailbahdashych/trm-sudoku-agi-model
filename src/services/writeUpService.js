const knex = require('../knex/knex')
const tableName = 'writeups'

module.exports = {
  async getWriteUps(q) {
    return knex(tableName)
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(q)
  },
  async getWriteUpById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
