const crypto = require('crypto')

module.exports = {
  encrypt: (text, key, iv) => {
    let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  },
  decrypt: (text, key, iv) => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
  },
  hashPassword: (password, key) => {
    const sha256Hasher = crypto.createHmac("sha256", key);
    return sha256Hasher.update(password).digest("hex");
  }
}
