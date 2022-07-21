const knex = require('../knex/knex');

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'blog-controller', path: 'blog' });

exports.getBlogPost = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting blog post by id: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getBlogPosts = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting blog posts: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.createBlogPost = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating blog post: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.commentBlogPost = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while commenting blog post: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
