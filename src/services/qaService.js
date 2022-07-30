const moment = require('moment')

const cryptoService = require('./cryptoService')
const questionRepository = require('../repositories/qaRepository')
const userRepository = require('../repositories/userRepository')

const ApiError = require('../exceptions/apiError')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'questions-service', path: 'questions' })

module.exports = {
  getQuestion: async ({ id, slug, view }, { transaction } = { transaction: null }) => {
    if (view) await questionRepository.incrementViewCounter({ id, slug }, { transaction })
    const question = await questionRepository.getQuestion({ id, slug }, { transaction
    })
    question.created_at = moment(question.created_at).format('YYYY-MM-DD HH:mm:ss')

    const answers = await questionRepository.getQuestionsAnswers({ questionId: question.id }, { transaction })
    answers.forEach(answer => {
      answer.created_at = moment(answer.created_at).format('YYYY-MM-DD HH:mm:ss')
    })

    return { question, answers }
  },
  getQuestions: async ({ sort, personalId }, { transaction } = { transaction: null }) => {
    let questions;

    const sorts = ['latest', 'hottest', 'week', 'month']
    if (!sorts.includes(sort)) throw ApiError.BadRequest()

    if (personalId) {
      const userSorts = ['latest', 'score', 'views']
      if (!userSorts.includes(sort)) throw ApiError.BadRequest()

      const user = await userRepository.getUserByPersonalId({ personalId }, { transaction })
      questions = await questionRepository.getUserQuestions({ userId: user.id, sort }, { transaction })
    }
    else {
      questions = await questionRepository.getQuestions({ sort }, { transaction })
    }

    const questionsIds = questions.map(x => x.id)
    const questionAnswers = await questionRepository.countQuestionsAnswers({ questionsIds }, { transaction })

    questions.forEach(question => {
      question.created_at = moment(question.created_at).format('YYYY-MM-DD HH:mm:ss')
      questionAnswers.forEach(answer => {
        answer.created_at = moment(answer.created_at).format('YYYY-MM-DD HH:mm:ss')
        if (question.id === answer.question_id) question.count = answer.count
      })
    })

    return questions
  },
  createQuestion: async ({ title, content, userId }, { transaction } = { transaction: null }) => {
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const createdQuestion = await questionRepository.createQuestion({
      title, content, slug, user_id: user.id
    }, { transaction })

    return { message: 'success', slug: createdQuestion[0].slug }
  },
  answerQuestion: async ({ questionId, answerText, userId }, { transaction } = { transaction: null }) => {
    // @TODO Check for input fields in validator middleware
    const decryptedUserId = cryptoService.decrypt(userId)
    const user = await userRepository.getUser({
      id: decryptedUserId
    }, { transaction })

    if (!user) throw ApiError.BadRequest()

    const { question, answers } = await questionRepository.getQuestion({ id: questionId }, { transaction })

    if (!question) throw ApiError.BadRequest()

    for (const answer in answers) {
      if (user.username === answer.username)
        throw ApiError.Conflict()
    }

    await questionRepository.answerQuestion({
      question_id: questionId,
      answer_text: answerText,
      author_answer_id: user.id
    }, { transaction })

    return { message: 'success' }
  }
}
