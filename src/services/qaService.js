const questionRepository = require('../repositories/qaRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'question-service', path: 'question' })

module.exports = {
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    try {
      return await questionRepository.getQuestion({ id, slug }, { transaction })
    } catch (e) {
      logger.error(`Error while getting question by id: ${e.message}`)
      throw Error('error-while-getting-question-by-id')
    }
  },
  getQuestionsBySortType: async ({ sort }, { transaction } = { transaction: null }) => {
    try {
      return await questionRepository.getQuestionsBySortType({ sort }, { transaction })
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
  }
}
