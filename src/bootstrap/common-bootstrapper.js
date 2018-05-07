const { Container } = require('../common/di');

function createContainer() {
  const container = new Container();
  container.registerInstance(Container, container);
  return Promise.resolve(container);
}

module.exports = {
  createContainer
};
