import { Container } from '../common/di';

export function createContainer() {
  const container = new Container();
  container.registerInstance(Container, container);
  return Promise.resolve(container);
}

export default {
  createContainer
};
