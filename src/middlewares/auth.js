const ApiError = require('../exceptions/apiError')

const jwtService = require('../services/jwtService');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return next(ApiError.UnauthorizedError())

    const token = req.headers.authorization.split(' ')[1]
    if (!token) next(ApiError.UnauthorizedError())

    const payload = jwtService.verifyToken({ token })
    if (payload.type !== 'access') return next(ApiError.UnauthorizedError())

    req.user = payload.userId
    next();
  } catch (e) {
    return next(ApiError.UnauthorizedError())
  }
}
