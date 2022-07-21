const knex = require('../knex/knex');

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'forum-controller', path: 'forum' });

exports.getForumThread = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting forum thread by id: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getForumThreads = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting forum threads: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.createForumThread = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating forum thread: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.commentForumThread = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while commenting forum thread: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
