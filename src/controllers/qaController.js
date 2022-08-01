const knex = require('../knex/knex');

const questionService = require('../services/qaService')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'questions-controller', path: 'questions' })

exports.getQuestion = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { slug } = req.query

    const { question, answers } = await questionService.getQuestion({ slug, view: true }, { transaction })

    await transaction.commit()
    return res.status(200).json({ question, answers })
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getSimilarQuestions = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { keywords } = req.query

    const similarQuestions = await questionService.getSimilarQuestions({
      keywords: keywords.split('-').sort().join(',')
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(similarQuestions)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getQuestions = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { sort } = req.params

    const questions = await questionService.getQuestions({ sort }, { transaction })

    await transaction.commit()
    return res.status(200).json(questions)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getUserQuestions = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { sort, personalId } = req.params

    const questions = await questionService.getQuestions({ sort, personalId })

    await transaction.commit()
    return res.status(200).json(questions)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.createQuestion = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { title, content } = req.body

    const result = await questionService.createQuestion({
      title, content, userId: req.user
    })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.answerQuestion = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { questionId, answerText } = req.body

    const result = await questionService.answerQuestion({
      questionId, answerText, userId: req.user
    })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
