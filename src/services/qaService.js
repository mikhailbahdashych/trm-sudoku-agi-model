const questionRepository = require('../repositories/qaRepository')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'question-service', path: 'question' })

module.exports = {
  getQuestionById: async ({ id }, { transaction } = { transaction: null }) => {
    try {
      return await questionRepository.getQuestionById({ id }, { transaction })
    } catch (e) {
      logger.error(`Error while getting question by id: ${e.message}`)
      throw Error("error-while-getting-question-by-id")
    }
  }
}
