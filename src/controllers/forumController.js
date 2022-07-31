const knex = require('../knex/knex');

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'forum-controller', path: 'forum' })

exports.getForumThread = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getForumThreads = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.createForumThread = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.commentForumThread = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
