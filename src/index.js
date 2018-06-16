require('babel-register')({ extensions: ['.jsx'] });
require('babel-polyfill');

const ElmuServer = require('./elmu-server');
const serverSettings = require('./bootstrap/server-settings');
const bootstrapper = require('./bootstrap/server-bootstrapper');

(async function index() {

  const container = await bootstrapper.createContainer();
  const elmuServer = container.get(ElmuServer);

  elmuServer.listen(serverSettings.port, err => {
    if (err) {
      /* eslint-disable-next-line no-console */
      console.error(err);
    } else {
      /* eslint-disable-next-line no-console */
      console.log(`App listening on http://localhost:${serverSettings.port}`);
    }
  });

})();
