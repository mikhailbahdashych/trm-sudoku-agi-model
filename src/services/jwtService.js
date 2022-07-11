const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const uuid = require('uuid')
dotenv.config();

const loggerInstance = require('../common/logger');
const logger = loggerInstance({ label: "jwt-service", path: "jwt" })

const privateKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/private.pem"));
const publicKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/public.pem"));

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

const encrypt = (text) => {
  return cryptoService.encrypt(text, process.env.CRYPTO_KEY.toString(), process.env.CRYPTO_IV.toString())
}

const generateAccessToken = ({ userId, username }) => {
  try {
    const payload = {
      userId: encrypt(userId),
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
    const id = encrypt(uuid.v4())
    const payload = { id, type: jwtConfig.refresh.type }
    const options = { expiresIn: jwtConfig.refresh.expiresIn }

    return { id, token: jwt.sign(payload, privateKey, options) }
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
  getTokenById: async ({ tokenId }, { transaction } = { transaction: null }) => {
    try {
      return await jwtRepository.getTokenById({ tokenId }, { transaction })
    } catch (e) {
      logger.error(`Error while getting token by id: ${e.message}`)
      throw Error("error-while-getting-token-by-id")
    }
  },
  updateTokens: async ({ userId, username }, { transaction } = { transaction: null }) => {
    try {
      const accessToken = generateAccessToken({ userId, username })
      const refreshToken = generateRefreshToken();

      await updateRefreshToken({
        tokenId: refreshToken.id,
        userId: encrypt(userId)
      }, { transaction })

      return { accessToken, refreshToken: refreshToken.token }
    } catch (e) {
      logger.error(`Error while updating tokens: ${e.message}`)
      throw Error("error-while-updating-tokens")
    }
  },
  verifyToken: ({ token }) => {
    try {
      return jwt.verify(token, publicKey)
    } catch (e) {
      logger.error(`Error while verifying token: ${e.message}`)
      throw Error("error-while-verifying-token")
    }
  }
}
