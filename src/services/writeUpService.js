const knex = require('../knex/knex')
const tableName = 'writeups'

module.exports = {
  async getWriteUpById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
