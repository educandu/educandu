import sinon from 'sinon';
import { Container } from '../common/di';
import PluginFactoryBase from './plugin-factory-base';

describe('document-service', () => {
  const sandbox = sinon.createSandbox();

  const createPluginType = ({ typeName, dependencies = [] }) => {
    const F = sandbox.stub();
    F.typeName = typeName;
    F.inject = () => dependencies;
    return F;
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe('_createInstance', () => {
    let result;

    describe('when called once', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = sut._createInstance(Plugin.typeName);
      });

      it('returns a new instance of the required plugin', () => {
        expect(result).toBeInstanceOf(Plugin);
      });
    });

    describe('when called multiple times', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = [sut._createInstance(Plugin.typeName), sut._createInstance(Plugin.typeName)];
      });

      it('returns a fresh instance for each call', () => {
        expect(result[0]).not.toBe(result[1]);
      });
    });

    describe('when called with the type of an unregistered plugin', () => {
      const Plugin1 = createPluginType({ typeName: 'plugin-1' });
      const Plugin2 = createPluginType({ typeName: 'plugin-2' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin1]);
        result = sut._createInstance(Plugin2.typeName);
      });

      it('returns undefined', () => {
        expect(result).toBeUndefined();
      });
    });

    describe('when called without arguments for a plugin without dependencies', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = sut._createInstance(Plugin.typeName);
      });

      it('calls the constructor without any arguments', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin);
      });
    });

    describe('when called with arguments for a plugin without dependencies', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = sut._createInstance(Plugin.typeName, 'arg', 325);
      });

      it('calls the constructor with the specified arguments', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin, 'arg', 325);
      });
    });

    describe('when called without arguments for a plugin with dependencies', () => {
      const Dep1 = class {};
      const Dep2 = class {};
      const Plugin = createPluginType({ typeName: 'plugin', dependencies: [Dep1, Dep2] });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = sut._createInstance(Plugin.typeName);
      });

      it('calls the constructor with the specified dependencies', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin, sinon.match.instanceOf(Dep1), sinon.match.instanceOf(Dep2));
      });
    });

    describe('when called with arguments for a plugin with dependencies', () => {
      const Dep1 = class {};
      const Dep2 = class {};
      const Plugin = createPluginType({ typeName: 'plugin', dependencies: [Dep1, Dep2] });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container, [Plugin]);
        result = sut._createInstance(Plugin.typeName, 'arg', 325);
      });

      it('calls the constructor with the specified dependencies and the specified arguments', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin, sinon.match.instanceOf(Dep1), sinon.match.instanceOf(Dep2), 'arg', 325);
      });
    });

  });

});
