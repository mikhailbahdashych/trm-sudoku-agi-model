const knex = require('../knex/knex')
const tableName = 'session_tokens'

module.exports = {
  getTokenById: async ({ tokenId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('token_id', tokenId)
      .first('user_id as userId')
    return transaction ? result.transacting(transaction) : result
  },
  createRefreshToken: async ({ tokenId, userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .insert({
        token_id: tokenId,
        user_id: userId
      })
    return transaction ? result.transacting(transaction) : result
  },
  deleteRefreshToken: async ({ userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('user_id', userId)
      .delete()
    return transaction ? result.transacting(transaction) : result
  }
}
