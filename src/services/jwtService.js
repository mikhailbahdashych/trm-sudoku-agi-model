const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const privateKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/private.pem"));
const publicKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/public.pem"));

exports.sign = payload => {
  return jwt.sign(
    payload,
    {
      key: privateKey,
      passphrase: process.env.JWT_PASSPHRASE.toString()
    },
    {
      algorithm: "RS256",
      expiresIn: "7d"
    }
  )
}

exports.getClient = token => {
  return jwt.verify(token, publicKey)
}

exports.getClientPromise = token => {
  return new Promise(((resolve, reject) => {
    jwt.verify(token, publicKey, (err, decoded) => {
      if (!err) {
        return resolve(decoded);
      } else {
        return reject(err);
      }
    })
  }))
}
