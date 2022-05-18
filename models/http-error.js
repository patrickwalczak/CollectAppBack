class HttpError extends Error {
  constructor(message, errorCode) {
    // super method allows to inherit message property from Error object
    super(message);
    // error code is a property which doesn't exist on Error object and we define it in HttpError object
    this.errorCode = errorCode;
  }
}

module.exports = HttpError;
