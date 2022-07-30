const knex = require('../knex/knex')

const voteService = require('../services/voteService')

exports.vote = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { id, vote, type } = req.params

    const result = await voteService.vote({
      id, vote, type, userId: req.user
    })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
