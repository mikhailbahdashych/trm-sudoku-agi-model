const jwtService = require('../services/jwtService');
const cryptoService = require('../services/cryptoService');
const userService = require('../repositories/userRepository');
const dotenv = require('dotenv');
dotenv.config();

exports.getClientByJwtToken = async ({ token }, { transaction } = { transaction: null }) => {
  try {
    const payload = jwtService.verifyToken({ token })
    if (payload.type !== 'access') return false

    const userId = cryptoService.decrypt(payload.userId, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())

    return await userService.getUserById({ id: userId }, { transaction })
  } catch (e) {
    return e.message
  }
}
