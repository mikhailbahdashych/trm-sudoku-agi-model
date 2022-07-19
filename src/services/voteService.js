const voteRepository = require('../repositories/voteRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'vote-service', path: 'vote' })

module.exports = {
  vote: async ({ id, v, type, userId }, { transaction } = { transaction: null }) => {
    try {
      return await voteRepository.vote({ [
          type === 'blog' ? 'blog_post_id' : type === 'forum' ? 'forum_post_id' : 'question_id'
          ]: id, v, user_id: userId }, { transaction })
    } catch (e) {
      logger.error(`Error while voting: ${e.message}`)
      throw Error('error-while-voting')
    }
  }
}
