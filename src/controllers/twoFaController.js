const twoFactorService = require('node-2fa');

const loggerInstance = require('../common/logger');
const { getClientByJwtToken } = require('../common/getClientByJwtToken')
const logger = loggerInstance({ label: 'client-controller', path: 'client' });

exports.setTwoFa = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });
  } catch (e) {
    logger.error(`Something went wrong while setting 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableTwoFa = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });
  } catch (e) {
    logger.error(`Something went wrong while disabling 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
