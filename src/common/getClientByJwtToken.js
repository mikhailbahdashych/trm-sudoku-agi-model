const jwtService = require('../services/jwtService');
const cryptoService = require('../services/cryptoService');
const userService = require('../services/userService');
const dotenv = require('dotenv');
dotenv.config();

exports.getClientByJwtToken = async (jwt) => {
  const userJwt = await jwtService.getUser(jwt)
  if (!userJwt) return false
  const clientId = cryptoService.decrypt(userJwt.uxd, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())
  return await userService.getUserById({ id: clientId })
}
