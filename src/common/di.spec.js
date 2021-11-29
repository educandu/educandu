import sinon from 'sinon';
import { Container, getDisposalInfo, DISPOSAL_PRIORITY } from './di.js';

class A {}

class B {}

class C {
  static get inject() { return [B]; }

  constructor(b) {
    this.b = b;
  }
}

class D {
  constructor() {
    this.disposedCalled = 0;
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => {
        this.disposedCalled += 1;
        return Promise.resolve();
      }
    };
  }
}

class E {
  // eslint-disable-next-line no-use-before-define
  static get inject() { return [F]; }
}

class F {
  // eslint-disable-next-line no-use-before-define
  static get inject() { return [G]; }
}

class G {
  static get inject() { return [E]; }
}

describe('di', () => {

  describe('Container', () => {

    describe('after creation', () => {
      it('should resolve itself', () => {
        const container = new Container();
        const result = container.get(Container);
        expect(result).toBe(container);
      });
    });

    describe('registerInstance', () => {
      it('should resolve to the same instance', () => {
        const container = new Container();
        const myInitializedA = new A();
        container.registerInstance(A, myInitializedA);
        const result = container.get(A);
        expect(result).toBe(myInitializedA);
      });
    });

    describe('registerService', () => {
      it('should resolve to an instance of the registered service', () => {
        const container = new Container();
        container.registerService(A, B);
        const result = container.get(A);
        expect(result).toBeInstanceOf(B);
      });
    });

    describe('get', () => {
      it('should auto-resolve transient dependencies', () => {
        const container = new Container();
        const resultC = container.get(C);
        const resultB = container.get(B);
        expect(resultC).toBeInstanceOf(C);
        expect(resultB).toBeInstanceOf(B);
        expect(resultC.b).toBeInstanceOf(B);
      });

      it('should throw on circular dependencies', () => {
        const container = new Container();
        expect(() => container.get(E)).toThrow('E -> F -> G -> E');
      });
    });

    describe('dispose', () => {
      it('should call all available object finalizers exactly once', async () => {
        const container = new Container();
        container.registerService(A, D);
        container.registerService(B, D);

        const resultA = container.get(A);
        const resultB = container.get(B);

        const previousDisposedCalled = resultA.disposedCalled;

        await container.dispose();

        expect(resultA).toBe(resultB);
        expect(resultA.disposedCalled).toBe(previousDisposedCalled + 1);
      });

      it('should call the dispose functions in the right priority order', async () => {
        const disposalInfoA = {
          priority: DISPOSAL_PRIORITY.domain,
          dispose: sinon.spy()
        };

        const a = {
          [getDisposalInfo]: () => disposalInfoA
        };

        const disposalInfoB = {
          priority: DISPOSAL_PRIORITY.storage,
          dispose: sinon.spy()
        };

        const b = {
          [getDisposalInfo]: () => disposalInfoB
        };
        const container = new Container();

        container.registerInstance(B, b);
        container.registerInstance(A, a);

        await container.dispose();
        sinon.assert.callOrder(disposalInfoA.dispose, disposalInfoB.dispose);
      });
    });

  });

});
