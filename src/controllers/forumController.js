const knex = require('../knex/knex');

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'forum-controller', path: 'forum' });

exports.getForumThreadById = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting forum post by id: ${e.message}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}

exports.createForumThread = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating forum post: ${e.message}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}
