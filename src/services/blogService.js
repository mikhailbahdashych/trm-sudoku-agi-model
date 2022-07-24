const blogRepository = require('../repositories/blogRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'blog-service', path: 'blog' })

module.exports = {
  getUserBlogPosts: async ({ userId }, { transaction } = { transaction: null }) => {
    try {
      return await blogRepository.getUserBlogPosts({ userId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting user's blog posts: ${e.message}`)
      throw Error('error-while-getting-users-blog-posts')
    }
  },
  getBlogPost: async ({ id, title }, { transaction } = { transaction: null }) => {
    try {
      return await blogRepository.getBlogPost({ id, title }, { transaction })
    } catch (e) {
      logger.error(`Error while getting blog post: ${e.message}`)
      throw Error('error-while-getting-blog-post')
    }
  }
}
