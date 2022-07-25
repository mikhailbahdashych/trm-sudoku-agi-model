const voteRepository = require('../repositories/voteRepository')
const postTypeRepository = require('../repositories/postTypeRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'vote-service', path: 'vote' })

module.exports = {
  vote: async ({ id, vote, type, userId }, { transaction } = { transaction: null }) => {
    try {
      const postType = await postTypeRepository.getPostTypeIdByType({ type })
      return await voteRepository.vote({ post_id: id, post_type_id: postType.id, vote, user_id: userId }, { transaction })
    } catch (e) {
      logger.error(`Error while voting: ${e.message}`)
      throw Error('error-while-voting')
    }
  }
}
