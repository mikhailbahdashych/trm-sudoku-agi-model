const cryptoService = require('./cryptoService')

const voteRepository = require('../repositories/voteRepository')
const postTypeRepository = require('../repositories/postTypeRepository')
const userRepository = require('../repositories/userRepository')
const blogRepository = require('../repositories/blogRepository')
const questionRepository = require('../repositories/qaRepository')

const ApiError = require('../exceptions/apiError')

module.exports = {
  vote: async ({ id, vote, type, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const votes = ['up', 'down']
    if (!votes.includes(vote) || !['blog', 'forum', 'question'].includes(type))
      throw ApiError.BadRequest()

    switch (type) {
      case 'blog':
        const blog = await blogRepository.getBlogPost({ id }, { transaction })
        if (!blog) throw ApiError.BadRequest()
        break
      case 'question':
        const question = await questionRepository.getQuestion({ id }, { transaction })
        if (!question) throw ApiError.BadRequest()
        break
      default:
        throw ApiError.BadRequest()
    }

    const postType = await postTypeRepository.getPostTypeIdByType({ type }, { transaction })

    await voteRepository.vote({ post_id: id, post_type_id: postType.id, vote, user_id: user.id }, { transaction })

    return { statusCode: 1 }
  }
}
