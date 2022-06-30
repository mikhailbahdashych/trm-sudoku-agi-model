const twoFactorService = require('node-2fa');

const twoFaService = require('../services/twoFaService');

const loggerInstance = require('../common/logger');
const { getClientByJwtToken } = require('../common/getClientByJwtToken')
const logger = loggerInstance({ label: 'client-controller', path: 'client' });

exports.setTwoFa = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });

    const client = await getClientByJwtToken(req.headers.ato)
    if (client === 'invalid signature') return res.status(200).json({ status: -1 });

    const { twoFaCode, twoFaToken } = req.body

    const resultTwoFa = twoFactorService.verifyToken(twoFaToken, twoFaCode);
    logger.info(`Setting 2FA for client with id: ${client.id}`)

    if (!resultTwoFa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (resultTwoFa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await twoFaService.setTwoFa(twoFaToken, twoFaCode)
    logger.info(`2FA was successfully created for client with id: ${ client.id }`)

    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while setting 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}

exports.disableTwoFa = async (req, res) => {
  try {
    if (!req.headers.ato || req.headers.ato === 'null')
      return res.status(200).json({ status: -1 });

    const client = await getClientByJwtToken(req.headers.ato)
    if (client === 'invalid signature') return res.status(200).json({ status: -1 });

    const { twoFaCode } = req.body

    const result2Fa = twoFactorService.verifyToken(client.twoFa, twoFaCode)

    if (!result2Fa) return res.status(403).json({ status: -1, message: 'access-forbidden' })
    if (result2Fa.delta !== 0) return res.status(403).json({ status: -1, message: 'access-forbidden' })

    await twoFaService.disableTwoFa(client.id)
    logger.info(`2FA was successfully disabled for client with id: ${client.id}`)

    return res.status(200).json({ status: 1 })
  } catch (e) {
    logger.error(`Something went wrong while disabling 2FA => ${e}`)
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
