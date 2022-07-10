const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const uuid = require('uuid')
dotenv.config();

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: "jwt-service", path: "jwt" })

const privateKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/private.pem"));

const jwtRepository = require("../repositories/jwtRepository");
const cryptoService = require("./cryptoService");

const jwtConfig = {
  secret: privateKey,
  passphrase: process.env.JWT_PASSPHRASE.toString(),
  access: {
    type: 'access',
    expiresIn: '15m'
  },
  refresh: {
    type: 'refresh',
    expiresIn: '25m'
  }
}

const generateAccessToken = ({ userId, username }) => {
  try {
    const payload = {
      userId,
      username,
      type: jwtConfig.access.type
    }
    const options = {
      expiresIn: jwtConfig.access.expiresIn,
      algorithm: "RS256"
    }
    const secret = {
      key: privateKey,
      passphrase: jwtConfig.passphrase
    }

    return jwt.sign(payload, secret, options)
  } catch (e) {
    logger.error(`Error while generating access JWT token => ${e}`)
    throw Error("error-while-generating-access-token")
  }
}

const generateRefreshToken = () => {
  try {
    const payload = {
      id: cryptoService.encrypt(uuid.v4(), process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString()),
      type: jwtConfig.refresh.type
    }
    const options = { expiresIn: jwtConfig.refresh.expiresIn }

    return jwt.sign(payload, privateKey, options)
  } catch (e) {
    logger.error(`Error while generating refresh JWT token => ${e}`)
    throw Error("error-while-generating-refresh-token")
  }
}

const updateRefreshToken = async ({ tokenId, userId }, { transaction } = { transaction: null }) => {
  try {
    await jwtRepository.deleteRefreshToken({ userId }, { transaction })
    return await jwtRepository.createRefreshToken({ tokenId, userId }, { transaction })
  } catch (e) {
    logger.error(`Error while updating refresh token: ${e.message}`)
    throw Error("error-while-updating-refresh-token")
  }
}

module.exports = {
  updateTokens: async ({ userId, username }, { transaction } = { transaction: null }) => {
    try {
      const accessToken = generateAccessToken({ userId, username })
      const refreshToken = generateRefreshToken();

      await updateRefreshToken({
        tokenId: cryptoService.decrypt(refreshToken.id, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString()),
        userId: cryptoService.decrypt(userId, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())
      }, { transaction })

      return { accessToken, refreshToken }
    } catch (e) {
      logger.error(`Error while updating tokens: ${e.message}`)
      throw Error("error-while-updating-tokens")
    }
  }
}
