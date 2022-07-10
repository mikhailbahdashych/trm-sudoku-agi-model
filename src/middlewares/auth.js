const jwtService = require('../services/jwtService');

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth)
      return res.status(401).json({ message: "unauthorized", status: 401 })

    const token = req.headers.authorization.split(' ')[1]
    const payload = jwtService.verifyToken({ token })

    if (payload.type !== 'access')
      return res.status(401).json({ message: "unauthorized", status: 401 })

    next();
  } catch (e) {
    return res.status(401).json({ message: "unauthorized", status: 401 })
  }
}
