const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'search-controller', path: 'search' })

exports.search = async (req, res) => {
  try {

  } catch (e) {
    logger.error(`Error while searching: ${e.message}`)
    throw Error('error-while-searching')
  }
}
