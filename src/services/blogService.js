const blogRepository = require('../repositories/blogRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'blog-service', path: 'blog' })

module.exports = {
  getUserBlogPosts: async ({ userId }, { transaction } = { transaction: null }) => {
    return await blogRepository.getUserBlogPosts({ userId }, { transaction })
  },
  getBlogPost: async ({ id, title }, { transaction } = { transaction: null }) => {
    return await blogRepository.getBlogPost({ id, title }, { transaction })
  }
}
