class ServerTimeController {
  handleGetServerTime(_req, res) {
    return res.send({ time: new Date() });
  }

  registerMiddleware(router) {
    router.get(
      '/api/v1/plugin/custom-plugin/server-time/time',
      (req, res) => this.handleGetServerTime(req, res)
    );
  }
}

export default ServerTimeController;
