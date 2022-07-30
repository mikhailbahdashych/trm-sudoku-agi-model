const knex = require('../knex/knex');

exports.getBlogPost = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getBlogPosts = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.createBlogPost = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.commentBlogPost = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
