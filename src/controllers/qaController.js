const knex = require('../knex/knex');

const questionService = require('../services/qaService')

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'question-controller', path: 'question' })

exports.getQuestionById = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { id } = req.params

    const question = await questionService.getQuestionById({ id }, { transaction })

    await transaction.commit()
    return res.status(200).json(question)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting question by id: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getQuestions = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { by } = req.params

    if (!['latest', 'hottest', 'week', 'month'].includes(by))
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const questions = await questionService.getQuestions({ by }, { transaction })

    await transaction.commit()
    return res.status(200).json(questions)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting questions: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.createQuestion = async (req, res) => {
  const transaction = await knex.transaction()
  try {

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating question: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
