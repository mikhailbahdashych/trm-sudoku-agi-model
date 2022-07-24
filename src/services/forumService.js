const forumRepository = require('../repositories/forumRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'forum-service', path: 'forum' })

module.exports = {
  getUserForumPosts: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await forumRepository.getUserForumPosts({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user's forum posts: ${e.message}`)
      throw Error('error-while-getting-users-forum-posts')
    }
  },
  getForumThread: async ({ id, title }, { transaction } = { transaction: null }) => {
    try {
      return await forumRepository.getForumThread({ id, title }, { transaction })
    } catch (e) {
      logger.error(`Error while getting forum thread: ${e.message}`)
      throw Error('error-while-getting-forum-thread-by-id')
    }
  }
}
