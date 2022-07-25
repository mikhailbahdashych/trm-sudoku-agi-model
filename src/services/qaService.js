const moment = require('moment')

const questionRepository = require('../repositories/qaRepository')
const userRepository = require('../repositories/userRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'question-service', path: 'question' })

module.exports = {
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    try {
      await questionRepository.incrementViewCounter({ id, slug }, { transaction })
      const question = await questionRepository.getQuestion({ id, slug }, { transaction
      })
      question.created_at = moment(question.created_at).format('YYYY-MM-DD HH:mm:ss')

      const answers = await questionRepository.getQuestionsAnswers({ questionId: question.id }, { transaction })
      answers.forEach(answer => {
        answer.created_at = moment(answer.created_at).format('YYYY-MM-DD HH:mm:ss')
      })

      return { question, answers }
    } catch (e) {
      logger.error(`Error while getting question: ${e.message}`)
      throw Error('error-while-getting-question-by-id')
    }
  },
  getQuestions: async ({ sort, personalId }, { transaction } = { transaction: null }) => {
    try {
      let questions;

      if (personalId) {
        const user = await userRepository.getUserByPersonalId({ personalId }, { transaction })
        questions = await questionRepository.getUserQuestions({ userId: user.id }, { transaction })
      }
      else questions = await questionRepository.getQuestions({ sort }, { transaction })

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
    } catch (e) {
      logger.error(`Error while getting questions by sort type: ${e.message}`)
      throw Error('error-while-getting-questions-by-sort-type')
    }
  },
  createQuestion: async (data, { transaction } = { transaction: null }) => {
    try {
      return await questionRepository.createQuestion(data, { transaction })
    } catch (e) {
      logger.error(`Error while creating question: ${e.message}`)
      throw Error('error-while-creating-question')
    }
  },
  answerQuestion: async (data, { transaction } = { transaction: null }) => {
    try {
      return await questionRepository.answerQuestion(data, { transaction })
    } catch (e) {
      logger.error(`Error while answering question: ${e.message}`)
      throw Error('error-while-answering-question')
    }
  }
}
