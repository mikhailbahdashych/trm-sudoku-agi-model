const blogRepository = require('../repositories/blogRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'blog-service', path: 'blog' })

module.exports = {
  getBlogPostById: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await blogRepository.getBlogPostById({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting blog post by id: ${e.message}`)
      throw Error('error-while-getting-blog-post-by-id')
    }
  }
}
