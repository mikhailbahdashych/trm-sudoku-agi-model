const ApiError = require('../exceptions/apiError');

module.exports = function (err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, error: err.error })
  }
  return res.status(500).json({ message: 'something-went-wrong', status: 500 })
}
