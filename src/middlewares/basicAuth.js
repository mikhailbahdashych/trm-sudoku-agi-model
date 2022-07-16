const dotenv = require('dotenv')
dotenv.config()

module.exports = (req, res, next) => {
  try {
    const basicUsername = process.env.BASIC_AUTH_USERNAME
    const basicPassword = process.env.BASIC_AUTH_PASSWORD
    const auth = req.headers.authorization;

    if (!auth)
      return res.status(401).json({ message: 'unauthorized', status: 401 })

    const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':');

    if (credentials[0] === basicUsername && credentials[1] === basicPassword) next()
    else return res.status(401).json({ message: 'unauthorized', status: 401 })
  } catch (e) {
    return res.status(401).json({ message: 'unauthorized', status: 401 })
  }
}
