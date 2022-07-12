const jwtService = require('../services/jwtService');
const userService = require('../repositories/userRepository');
const dotenv = require('dotenv');
dotenv.config();

exports.getClientByJwtToken = async ({ token }, { transaction } = { transaction: null }) => {
  try {
    const payload = jwtService.verifyToken({ token })
    if (payload.type !== 'access') return false

    const verifiedToken = await jwtService.getTokenById({ tokenId: payload.id }, { transaction })
    if (!verifiedToken) return false

    return await userService.getUserById({ id: verifiedToken.userId }, { transaction })
  } catch (e) {
    return e.message
  }
}
