const knex = require('../knex/knex')
const tableName = 'ctfs'

module.exports = {
  async getCtfById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
