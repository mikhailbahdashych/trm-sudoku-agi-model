const cryptoService = require('./cryptoService')

const userRepository = require('../repositories/userRepository')
const postTypeRepository = require('../repositories/postTypeRepository')
const bookmarksRepository = require('../repositories/bookmarkRepository')
const blogRepository = require('../repositories/blogRepository')
const forumRepository = require('../repositories/forumRepository')
const questionRepository = require('../repositories/qaRepository')

const ApiError = require('../exceptions/apiError')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'bookmarks-service', path: 'bookmarks' })

module.exports = {
  addBookmark: async ({ type, id, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    let post

    switch (type) {
      case 'blog':
        post = await blogRepository.getBlogPost({ id }, { transaction })
        if (!post) throw ApiError.BadRequest()
        break
      case 'forum':
        post = await forumRepository.getForumThread({ id }, { transaction })
        if (!post) throw ApiError.BadRequest()
        break
      case 'question':
        const { question } = await questionRepository.getQuestion({ id }, { transaction })
        post = question
        if (!post) throw ApiError.BadRequest()
        break
      default:
        throw ApiError.BadRequest()
    }

    const postType = await postTypeRepository.getPostTypeIdByType({ type }, { transaction })
    await bookmarksRepository.addBookmark({
      post_id: id,
      post_type_id: postType.id,
      user_id: userId,
      post_title: post.postTitle,
      post_slug: post.postSlug
    }, { transaction })

    return { message: 'success' }
  },
  getBookmarks: async ({ userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    return await bookmarksRepository.getBookmarks({
      userId: user.id
    }, { transaction })
  },
  deleteBookmark: async ({ id, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    await bookmarksRepository.deleteBookmark({
      id, userId: user.id
    })

    return { message: 'success' }
  }
}
