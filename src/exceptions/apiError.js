module.exports = class ApiError extends Error {
  status;
  error;

  constructor(status, message, error) {
    super(message)
    this.status = status
    this.error = error
  }

  static BadRequest() {
    return new ApiError(400, 'bad-request')
  }

  static UnauthorizedError(error = null) {
    return new ApiError(401, 'unauthorized', error)
  }

  static AccessForbidden(error = null) {
    return new ApiError(403, 'access-forbidden', error)
  }

  static Conflict() {
    return new ApiError(409, 'conflict')
  }
}
