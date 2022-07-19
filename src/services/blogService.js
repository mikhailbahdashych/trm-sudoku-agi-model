const blogRepository = require('../repositories/blogRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'blog-service', path: 'blog' })

module.exports = {
  getBlogPost: async ({ id, title }, { transaction } = { transaction: null }) => {
    try {
      return await blogRepository.getBlogPost({ id, title }, { transaction })
    } catch (e) {
      logger.error(`Error while getting blog post: ${e.message}`)
      throw Error('error-while-getting-blog-post')
    }
  }
}
