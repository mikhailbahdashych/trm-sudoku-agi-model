const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const uuid = require('uuid')
dotenv.config();

const privateKey = fs.readFileSync(path.resolve(__dirname + '../../../keys/private.pem'));
const publicKey = fs.readFileSync(path.resolve(__dirname + '../../../keys/public.pem'));

const jwtRepository = require('../repositories/jwtRepository');
const cryptoService = require('./cryptoService');

const jwtConfig = {
  secret: privateKey,
  passphrase: process.env.JWT_PASSPHRASE.toString(),
  access: {
    type: 'access',
    expiresIn: '15m'
  },
  refresh: {
    type: 'refresh',
    expiresIn: '7d'
  }
}

const generateAccessToken = ({ userId, personalId, username, reputation }) => {
  try {
    const payload = {
      userId: cryptoService.encrypt(userId),
      username,
      personalId,
      reputation,
      type: jwtConfig.access.type
    }
    const secret = {
      key: privateKey,
      passphrase: jwtConfig.passphrase
    }
    const options = {
      expiresIn: jwtConfig.access.expiresIn,
      algorithm: 'RS256'
    }

    return jwt.sign(payload, secret, options)
  } catch (e) {
    throw Error('error-while-generating-access-token')
  }
}

const generateRefreshToken = () => {
  try {
    const id = cryptoService.encrypt(uuid.v4())
    const payload = {
      id,
      type: jwtConfig.refresh.type
    }
    const secret = {
      key: privateKey,
      passphrase: jwtConfig.passphrase
    }
    const options = {
      expiresIn: jwtConfig.refresh.expiresIn,
      algorithm: 'RS256'
    }

    return { id, token: jwt.sign(payload, secret, options) }
  } catch (e) {
    throw Error('error-while-generating-refresh-token')
  }
}

const updateRefreshToken = async ({ tokenId, userId }, { transaction } = { transaction: null }) => {
  try {
    await jwtRepository.deleteRefreshToken({ userId }, { transaction })
    return await jwtRepository.createRefreshToken({ tokenId, userId }, { transaction })
  } catch (e) {
    throw Error('error-while-updating-refresh-token')
  }
}

module.exports = {
  getTokenByTokenId: async ({ tokenId }, { transaction } = { transaction: null }) => {
    try {
      return await jwtRepository.getTokenByTokenId({ tokenId }, { transaction })
    } catch (e) {
      throw Error('error-while-getting-token-by-id')
    }
  },
  updateTokens: async ({ userId, username, personalId, reputation }, { transaction } = { transaction: null }) => {
    try {
      const accessToken = generateAccessToken({ userId, username, personalId, reputation })
      const refreshToken = generateRefreshToken();

      await updateRefreshToken({
        tokenId: refreshToken.id,
        userId: cryptoService.encrypt(userId)
      }, { transaction })

      return { accessToken, refreshToken: refreshToken.token }
    } catch (e) {
      throw Error('error-while-updating-tokens')
    }
  },
  verifyToken: ({ token }) => {
    try {
      return jwt.verify(token, publicKey)
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError)
        return { message: 'invalid-token' }
    }
  }
}
