const forumRepository = require('../repositories/forumRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'forum-service', path: 'forum' })

module.exports = {
  getForumThreadById: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await forumRepository.getForumThreadById({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting forum thread by id: ${e.message}`)
      throw Error("error-while-getting-forum-thread-by-id")
    }
  }
}
