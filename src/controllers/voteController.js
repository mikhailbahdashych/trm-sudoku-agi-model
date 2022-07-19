const knex = require('../knex/knex')

const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')
const blogService = require('../services/blogService')
const forumService = require('../services/forumService')
const questionService = require('../services/qaService')
const voteService = require('../services/voteService')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'vote-controller', path: 'vote' })

exports.vote = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { id, v, type } = req.params

    if (!['up', 'down'].includes(v) || !['blog', 'forum', 'question'].includes(type))
      return res.status(400).json({ message: 'bad-request', status: 400 })

    switch (type) {
      case 'blog':
        const blogPost = await blogService.getBlogPostById({ id }, { transaction })
        if (!blogPost)
          return res.status(400).json({ message: 'bad-request', status: 400 })
        break;
      case 'forum':
        const forumPost = await forumService.getForumThreadById({ id }, { transaction })
        if (!forumPost)
          return res.status(400).json({ message: 'bad-request', status: 400 })
        break;
      case 'question':
        const questionPost = await questionService.getQuestion({ id }, { transaction })
        if (!questionPost)
          return res.status(400).json({ message: 'bad-request', status: 400 })
        break;
    }

    await voteService.vote({ id, v, type, userId: user.id })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while voting: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
