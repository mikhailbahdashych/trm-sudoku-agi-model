const knex = require('../knex/knex')

const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')
const voteService = require('../services/voteService')

const loggerInstance = require('../common/logger')
const blogService = require('../services/blogService')
const forumService = require('../services/forumService')
const questionsService = require('../services/qaService')
const logger = loggerInstance({ label: 'vote-controller', path: 'vote' })

exports.vote = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { id, vote, type } = req.params

    if (!['up', 'down'].includes(vote) || !['blog', 'forum', 'question'].includes(type))
      return res.status(400).json({ message: 'bad-request', status: 400 })

    switch (type) {
      case 'blog':
        const blog = await blogService.getBlogPost({ id }, { transaction })
        if (!blog) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      case 'question':
        const question = await questionsService.getQuestion({ id }, { transaction })
        if (!question) return res.status(400).json({ message: 'bad-request', status: 400 })
        break
      default:
        return res.status(400).json({ message: 'bad-request', status: 400 })
    }

    await voteService.vote({ id, vote, type, userId: user.id })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while voting: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
