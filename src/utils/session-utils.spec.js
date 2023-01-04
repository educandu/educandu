import { createSandbox } from 'sinon';
import { describe, expect, it } from 'vitest';
import { generateSessionId, isSessionValid } from './session-utils.js';

describe('session-utils', () => {
  const sandbox = createSandbox();

  describe('isSessionValid', () => {

    it('returns true when there is no session', () => {
      const req = { ip: '127.0.0.1', get: sandbox.stub() };
      expect(isSessionValid(req)).equals(true);
    });

    it('returns true when the known secret is provided as a request header', () => {
      const req = { ip: '127.0.0.1', get: sandbox.stub() };
      req.get.returns('wrong-secret');
      req.get.withArgs('x-rooms-auth-header').returns('secret');

      expect(isSessionValid(req, 'secret')).equals(true);
    });

    it('returns false when a wrong secret is provided as a request header', () => {
      const req = { ip: '127.0.0.1', get: sandbox.stub() };
      req.get.returns('wrong-secret');

      expect(isSessionValid(req, 'secret')).equals(true);
    });

    it('returns true when the session was created from a request with the same IP', () => {
      const req = {
        ip: '127.0.0.1',
        session: {
          id: generateSessionId({ ip: '127.0.0.1' })
        },
        get: sandbox.stub()
      };
      expect(isSessionValid(req)).equals(true);
    });

    it('returns false when the session was created from a request with a different IP', () => {
      const req = {
        ip: '127.0.0.1',
        session: {
          id: generateSessionId({ ip: '127.0.0.2' })
        },
        get: sandbox.stub()
      };
      expect(isSessionValid(req)).equals(false);
    });

  });

});
