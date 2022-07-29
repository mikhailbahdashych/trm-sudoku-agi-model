const knex = require('../knex/knex')
const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')
const blogService = require('../services/blogService')
const forumService = require('../services/forumService')
const questionsService = require('../services/qaService')

exports.addBookmark = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { type, id } = req.body
    let post

    switch (type) {
      case 'blog':
        post = await blogService.getBlogPost({ id }, { transaction })
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      case 'forum':
        post = await forumService.getForumThread({ id }, { transaction })
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      case 'question':
        const { question } = await questionsService.getQuestion({ id }, { transaction })
        post = question
        if (!post) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      default:
        return res.status(400).json({ message: 'bad-request', status: 400 })
    }

    await userService.addBookmark({
      type,
      id,
      userId: user.id,
      postTitle: post.title,
      postSlug: post.slug
    })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while adding bookmark: ${e.message}`)
    next(e)
  }
}

exports.getBookmarks = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const bookmarks = await userService.getBookmarks({ userId: user.id }, { transaction })

    await transaction.commit()
    return res.status(200).json(bookmarks)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting bookmarks: ${e.message}`)
    next(e)
  }
}

exports.deleteBookmark = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { id } = req.params

    await userService.deleteBookmark({ id, userId: user.id }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while deleting bookmark: ${e.message}`)
    next(e)
  }
}
