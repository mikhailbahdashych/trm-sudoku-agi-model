const knex = require('../knex/knex');

const questionService = require('../services/qaService')
const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: 'question-controller', path: 'question' })

exports.getQuestion = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    const { question, answers } = await questionService.getQuestion({ slug }, { transaction })

    await transaction.commit()
    return res.status(200).json({ question, answers })
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

    const questions = await questionService.getQuestions({ sort }, { transaction })

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

    const { title, content } = req.body

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const createdQuestion = await questionService.createQuestion({
      title, content, slug, user_id: user.id
    }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1, slug: createdQuestion[0].slug })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while creating question: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.answerQuestion = async (req, res) => {
  const transaction = await knex.transaction()
  try {
    const user = await userService.getUser({
      id: cryptoService.decrypt(req.user)
    }, { transaction })

    const { question_id, answer_text } = req.body

    if (!question_id || !answer_text)
      return res.status(400).json({ message: 'bad-request', status: 400 })

    const { question, answers } = await questionService.getQuestion({ id: question_id }, { transaction })

    if (!question) return res.status(400).json({ message: 'bad-request', status: 400 })

    for (const answer in answers) {
      if (user.username === answer.username)
        return res.status(409).json({ message: 'conflict', status: 409 })
    }

    await questionService.answerQuestion({ question_id, answer_text, author_answer_id: user.id }, { transaction })

    await transaction.commit()
    return res.status(200).json({ status: 1 })
  } catch (e) {
    await transaction.rollback()
    logger.error(`Something went wrong while answering the question: ${e.message}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
