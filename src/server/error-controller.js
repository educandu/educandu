class ErrorController {
  registerErrorHandler(app) {
    app.use((err, req, res, next) => {
      /* eslint-disable-next-line no-console */
      console.error(err);
      next(err);
    });
  }
}

module.exports = ErrorController;
