import sinon from 'sinon';
import { ERROR_CODES } from '../domain/constants.js';
import { tryApiCallWithLoginFallback } from './api-helper.js';

describe('api-helper', () => {
  describe('tryApiCallWithLoginFallback', () => {
    let result;
    let executeCall;
    let onLoginRequested;

    beforeEach(() => {
      result = null;
      executeCall = sinon.stub();
      onLoginRequested = sinon.stub();
    });

    describe('when the API call succeeds on the first try', () => {
      beforeEach(async () => {
        executeCall.resolves({ result: 'abc' });
        result = await tryApiCallWithLoginFallback({ executeCall, onLoginRequested });
      });
      it('returns the result of the first API call', () => {
        expect(result).toEqual({ result: 'abc' });
      });
      it('does not execute the API call a second time', () => {
        sinon.assert.calledOnce(executeCall);
      });
      it('does not invoce the re-login callback', () => {
        sinon.assert.notCalled(onLoginRequested);
      });
    });

    describe('when the API call fails on the first try because the session has expired', () => {
      describe('and the re-login callback resolves to `true`', () => {
        describe('and the second API call succeeds', () => {
          beforeEach(async () => {
            executeCall
              .onFirstCall().rejects({ code: ERROR_CODES.sessionExpired })
              .onSecondCall().resolves({ result: 'xyz' });
            onLoginRequested.resolves(true);
            result = await tryApiCallWithLoginFallback({ executeCall, onLoginRequested });
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
            onLoginRequested.resolves(true);
          });
          it('rejects with the thrown error', async () => {
            await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequested })).rejects.toThrowError('random');
          });
        });
      });
      describe('and the re-login callback resolves to `false`', () => {
        beforeEach(() => {
          executeCall
            .onFirstCall().rejects({ code: ERROR_CODES.sessionExpired })
            .onSecondCall().resolves({ result: 'xyz' });
          onLoginRequested.resolves(false);
        });
        it('rejects with a cancellation error', async () => {
          await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequested })).rejects.toThrowError('cancelled');
        });
        it('does not execute the API call a second time', async () => {
          await tryApiCallWithLoginFallback({ executeCall, onLoginRequested }).catch(() => {});
          sinon.assert.calledOnce(executeCall);
        });
      });
    });

    describe('when the API call fails on the first try because of other reasons', () => {
      beforeEach(() => {
        executeCall.rejects(new Error('random'));
      });
      it('rejects with the thrown error', async () => {
        await expect(() => tryApiCallWithLoginFallback({ executeCall, onLoginRequested })).rejects.toThrowError('random');
      });
      it('does not execute the API call a second time', async () => {
        await tryApiCallWithLoginFallback({ executeCall, onLoginRequested }).catch(() => {});
        sinon.assert.calledOnce(executeCall);
      });
      it('does not invoce the re-login callback', async () => {
        await tryApiCallWithLoginFallback({ executeCall, onLoginRequested }).catch(() => {});
        sinon.assert.notCalled(onLoginRequested);
      });
    });
  });
});
