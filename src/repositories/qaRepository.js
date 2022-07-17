const knex = require('../knex/knex')
const tableName = 'questions'

module.exports = {
  getQuestionById: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .first()
    return transaction ? result.transacting(transaction) : result
  },
  getQuestionsBy: async ({ by }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .first()
    return transaction ? result.transacting(transaction) : result
  }
}
