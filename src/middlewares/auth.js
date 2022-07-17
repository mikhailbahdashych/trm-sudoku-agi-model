const jwtService = require('../services/jwtService');
const userService = require('../services/userService')
const cryptoService = require('../services/cryptoService')

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth)
      return res.status(401).json({ message: 'unauthorized', status: 401 })

    const token = req.headers.authorization.split(' ')[1]
    const payload = jwtService.verifyToken({ token })

    if (payload.type !== 'access')
      return res.status(401).json({ message: 'unauthorized', status: 401 })

    const user = await userService.getUser({
      id: cryptoService.decrypt(payload.userId)
    }, { transaction })

    if (!user)
      return res.status(401).json({ message: 'unauthorized', status: 401 })

    req.user = payload.userId

    next();
  } catch (e) {
    return res.status(401).json({ message: 'unauthorized', status: 401 })
  }
}
