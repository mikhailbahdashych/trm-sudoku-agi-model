const knex = require('../knex/knex');

const userService = require('../services/userService')
const blogService = require('../services/blogService')
const forumService = require('../services/forumService')
const questionService = require('../services/qaService')

exports.search = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    const users = await userService.getUser({ username: slug }, { transaction })
    const blogs = await blogService.getBlogPost({ title: slug }, { transaction })
    const threads = await forumService.getForumThread({ title: slug }, { transaction })
    const questions = await questionService.getQuestion({ slug }, { transaction })

    await transaction.commit()
    return res.status(200).json({ users, blogs, threads, questions })
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
