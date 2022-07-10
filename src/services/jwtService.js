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

module.exports = {
  generateAccessToken: ({ userId, username }) => {
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

      return jwt.sign(payload, secret, options, (err) => {
        logger.error(`Access token JWT generating error => ${err}`)
      })
    } catch (e) {
      logger.error(`Error while generating access JWT token => ${e}`)
      throw Error("error-while-generating-access-token")
    }
  },
  generateRefreshToken: () => {
    try {
      const payload = {
        id: uuid.v4(),
        type: jwtConfig.refresh.type
      }
      const options = { expiresIn: jwtConfig.refresh.expiresIn }
      const secret = {
        key: privateKey,
        passphrase: jwtConfig.passphrase
      }

      return {
        token: jwt.sign(payload, secret, options, (err) => {
          logger.error(`Refresh token JWT generating error => ${err}`)
        })
      }
    } catch (e) {
      logger.error(`Error while generating refresh JWT token => ${e}`)
      throw Error("error-while-generating-refresh-token")
    }
  },
  updateRefreshToken: async ({ tokenId, userId }, { transaction } = { transaction: null }) => {
    try {
      await jwtRepository.deleteRefreshToken({ userId }, { transaction })
      return await jwtRepository.createRefreshToken({ tokenId, userId }, { transaction })
    } catch (e) {
      logger.error(`Error while updating refresh token: ${e.message}`)
      throw Error("error-while-updating-refresh-token")
    }
  },
  updateTokens: async ({ userId, username }, { transaction } = { transaction: null }) => {
    try {
      const accessToken = this.generateAccessToken({ userId, username })
      const refreshToken = this.generateRefreshToken();

      await this.updateRefreshToken({
        tokenId: refreshToken.id,
        userId
      }, { transaction })

      return {
        accessToken,
        refreshToken: refreshToken.token
      }
    } catch (e) {
      logger.error(`Error while updating tokens: ${e.message}`)
      throw Error("error-while-updating-tokens")
    }
  }
}
