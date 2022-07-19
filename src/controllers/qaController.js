const knex = require('../knex/knex');

const questionService = require('../services/qaService')
const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'question-controller', path: 'question' })

exports.getQuestionById = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { id } = req.params

    const question = await questionService.getQuestion({ id }, { transaction })

    await transaction.commit()
    return res.status(200).json(question)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting question by id: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getQuestionBySlug = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    const question = await questionService.getQuestion({ slug }, { transaction })

    await transaction.commit()
    return res.status(200).json(question)
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while getting question by slug: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.getQuestions = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { sort } = req.params

    if (!['latest', 'hottest', 'week', 'month'].includes(sort))
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const questions = await questionService.getQuestionsBySortType({ sort }, { transaction })

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
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { title, content, notify } = req.body

    if (!title || !content || !notify)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const createdQuestion = await questionService.createQuestion({
      title, content, notify, slug: title.split(' ').join('-').toLowerCase(), author_id: user.id
    }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1, questionId: createdQuestion[0].id })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating question: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
