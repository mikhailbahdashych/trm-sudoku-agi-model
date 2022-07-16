const knex = require('../knex/knex')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'vote-controller', path: 'vote' })

exports.vote = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while voting: ${e.message}`)
    return res.status(500).json({ message: "something-went-wrong", status: 500 })
  }
}
