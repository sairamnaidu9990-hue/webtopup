function notFoundHandler(req, res, next) {
  const error = new Error(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

module.exports = {
  notFoundHandler,
};
