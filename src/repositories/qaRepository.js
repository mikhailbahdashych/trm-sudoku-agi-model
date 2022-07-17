const knex = require('../knex/knex')
const tableName = 'questions'

module.exports = {
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .modify((x) => {
        if (id) x.where('id', id)
        else if (slug) x.where('slug', 'ilike',`%${slug}%`)
      }).first()
    return transaction ? result.transacting(transaction) : result
  },
  getQuestionsBySortType: async ({ by }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .modify((x) => {
        if (by === 'latest') {
          x.limit(10)
          x.orderBy('created_at')
          x.select('*')
        }
      })
    return transaction ? result.transacting(transaction) : result
  },
  createQuestion: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data).returning('id')
    return transaction ? result.transacting(transaction) : result
  }
}
