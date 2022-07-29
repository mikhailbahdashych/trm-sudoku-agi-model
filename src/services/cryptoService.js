const crypto = require('crypto')
require('dotenv').config()

const key = process.env.CRYPTO_KEY.toString()
const iv = process.env.CRYPTO_IV.toString()
const salt = process.env.CRYPTO_SALT.toString()

const encryptText = (text) => {
  let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

const decryptText = (text) => {
  let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(text, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
}

module.exports = {
  encrypt: (text) => { return encryptText(text) },
  decrypt: (text) => { return decryptText(text) },
  hashPassword: (password) => {
    const sha256Hasher = crypto.createHmac('sha256', salt);
    return sha256Hasher.update(password).digest('hex');
  }
}
