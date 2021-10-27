import { Container } from '../common/di.js';

export function createContainer() {
  const container = new Container();
  container.registerInstance(Container, container);
  return Promise.resolve(container);
}

export default {
  createContainer
};
