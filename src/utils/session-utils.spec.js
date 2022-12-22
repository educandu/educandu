import { describe, expect, it } from 'vitest';
import { generateSessionId, isSessionValid } from './session-utils.js';

describe('session-utils', () => {

  describe('isSessionValid', () => {

    it('returns true when there is no session', () => {
      const req = { ip: '127.0.0.1' };
      expect(isSessionValid(req)).equals(true);
    });

    it('returns true when the session was created from a request with the same IP', () => {
      const req = {
        ip: '127.0.0.1',
        session: {
          id: generateSessionId({ ip: '127.0.0.1' })
        }
      };
      expect(isSessionValid(req)).equals(true);
    });

    it('returns false when the session was created from a request with a different IP', () => {
      const req = {
        ip: '127.0.0.1',
        session: {
          id: generateSessionId({ ip: '127.0.0.2' })
        }
      };
      expect(isSessionValid(req)).equals(false);
    });

  });

});
