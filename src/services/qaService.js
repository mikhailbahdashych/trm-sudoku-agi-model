const questionRepository = require('../repositories/qaRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'question-service', path: 'question' })

module.exports = {
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    try {
      const question = await questionRepository.getQuestion({ id, slug }, { transaction
      })
      const answers = await questionRepository.getQuestionsAnswers({ questionId: question.id }, { transaction })
      return { question, answers }
    } catch (e) {
      logger.error(`Error while getting question: ${e.message}`)
      throw Error('error-while-getting-question-by-id')
    }
  },
  getQuestions: async ({ sort }, { transaction } = { transaction: null }) => {
    try {
      const questions = await questionRepository.getQuestions({ sort }, { transaction })
      const questionsIds = questions.map(x => x.id)
      const questionAnswers = await questionRepository.countQuestionsAnswers({ questionsIds }, { transaction })

      questions.forEach(question => {
        questionAnswers.forEach(answer => {
          if (question.id === answer.question_id)
            question.count = answer.count
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
