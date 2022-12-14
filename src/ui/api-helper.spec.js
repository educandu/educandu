import { assert, createSandbox } from 'sinon';
import { ERROR_CODES } from '../domain/constants.js';
import { tryApiCallWithLoginFallback } from './api-helper.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('api-helper', () => {
  const sandbox = createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('tryApiCallWithLoginFallback', () => {
    let result;
    let executeCall;
    let onLoginRequired;

    beforeEach(() => {
      result = null;
      executeCall = sandbox.stub();
      onLoginRequired = sandbox.stub();
    });

    describe('when the API call succeeds on the first try', () => {
      beforeEach(async () => {
        executeCall.resolves({ result: 'abc' });
        result = await tryApiCallWithLoginFallback({ executeCall, onLoginRequired });
      });
      it('returns the result of the first API call', () => {
        expect(result).toEqual({ result: 'abc' });
      });
      it('does not execute the API call a second time', () => {
        assert.calledOnce(executeCall);
      });
      it('does not invoke the re-login callback', () => {
        assert.notCalled(onLoginRequired);
      });
    });

    describe('when the API call fails on the first try because the session has expired', () => {
      describe('and the re-login callback resolves to `true`', () => {
        describe('and the second API call succeeds', () => {
          beforeEach(async () => {
            executeCall
              .onFirstCall().rejects({ code: ERROR_CODES.sessionExpired })
              .onSecondCall().resolves({ result: 'xyz' });
            onLoginRequired.resolves(true);
            result = await tryApiCallWithLoginFallback({ executeCall, onLoginRequired });
          });
          it('returns the result of the second API call', () => {
            expect(result).toEqual({ result: 'xyz' });
          });
        });
        describe('and the second API call fails out of other reasons', () => {
          beforeEach(() => {
            executeCall
              .onFirstCall().rejects({ code: ERROR_CODES.sessionExpired })
              .onSecondCall().rejects(new Error('random'));
            onLoginRequired.resolves(true);
          });
          it('rejects with the thrown error', async () => {
            await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequired })).rejects.toThrowError('random');
          });
        });
      });
      describe('and the re-login callback resolves to `false`', () => {
        beforeEach(() => {
          executeCall
            .onFirstCall().rejects({ code: ERROR_CODES.sessionExpired })
            .onSecondCall().resolves({ result: 'xyz' });
          onLoginRequired.resolves(false);
        });
        it('rejects with a cancellation error', async () => {
          await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequired })).rejects.toThrowError('cancelled');
        });
        it('does not execute the API call a second time', async () => {
          await tryApiCallWithLoginFallback({ executeCall, onLoginRequired }).catch(() => {});
          assert.calledOnce(executeCall);
        });
      });
    });

    describe('when the API call fails on the first try because of other reasons', () => {
      beforeEach(() => {
        executeCall.rejects(new Error('random'));
      });
      it('rejects with the thrown error', async () => {
        await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequired })).rejects.toThrowError('random');
      });
      it('does not execute the API call a second time', async () => {
        await tryApiCallWithLoginFallback({ executeCall, onLoginRequired }).catch(() => {});
        assert.calledOnce(executeCall);
      });
      it('does not invoke the re-login callback', async () => {
        await tryApiCallWithLoginFallback({ executeCall, onLoginRequired }).catch(() => {});
        assert.notCalled(onLoginRequired);
      });
    });
  });
});
