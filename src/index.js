/* eslint no-console: off */

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
      console.error(err);
    } else {
      console.log(`App listening on http://localhost:${serverSettings.port}`);
    }
  });

})();
