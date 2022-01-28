import sinon from 'sinon';
import { Container } from '../common/di.js';
import PluginFactoryBase from './plugin-factory-base.js';

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

  describe('_getInstance', () => {
    let result;

    describe('when called once', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container);
        sut.registerPlugin(Plugin);
        result = sut._getInstance(Plugin.typeName);
      });

      it('returns a new instance of the required plugin', () => {
        expect(result).toBeInstanceOf(Plugin);
      });
    });

    describe('when called multiple times', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container);
        sut.registerPlugin(Plugin);
        result = [sut._getInstance(Plugin.typeName), sut._getInstance(Plugin.typeName)];
      });

      it('returns the same instance for each call', () => {
        expect(result[0]).toBe(result[1]);
      });
    });

    describe('when called with the type of an unregistered plugin', () => {
      let sut;
      const Plugin1 = createPluginType({ typeName: 'plugin-1' });
      const Plugin2 = createPluginType({ typeName: 'plugin-2' });

      beforeEach(() => {
        const container = new Container();
        sut = new PluginFactoryBase(container);
        sut.registerPlugin(Plugin1);
      });

      it('throws an error', () => {
        expect(() => sut._getInstance(Plugin2.typeName)).toThrow();
      });
    });

    describe('when called for a plugin without dependencies', () => {
      const Plugin = createPluginType({ typeName: 'plugin' });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container);
        sut.registerPlugin(Plugin);
        result = sut._getInstance(Plugin.typeName);
      });

      it('calls the constructor without any arguments', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin);
      });
    });

    describe('when called for a plugin with dependencies', () => {
      const Dep1 = class {};
      const Dep2 = class {};
      const Plugin = createPluginType({ typeName: 'plugin', dependencies: [Dep1, Dep2] });

      beforeEach(() => {
        const container = new Container();
        const sut = new PluginFactoryBase(container);
        sut.registerPlugin(Plugin);
        result = sut._getInstance(Plugin.typeName);
      });

      it('calls the constructor with the specified dependencies', () => {
        sinon.assert.calledOnce(Plugin);
        sinon.assert.calledWith(Plugin, sinon.match.instanceOf(Dep1), sinon.match.instanceOf(Dep2));
      });
    });

  });

});
