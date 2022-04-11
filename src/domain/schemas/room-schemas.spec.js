import { validate } from '../validation.js';
import { ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE } from '../constants.js';
import { postRoomBodySchema, patchRoomBodySchema, postRoomInvitationBodySchema } from './room-schemas.js';

describe('postRoomBodySchema', () => {
  describe('when the body contains the required data and the access is public', () => {
    it('should pass validation', () => {
      const body = {
        name: 'my room',
        slug: '',
        access: ROOM_ACCESS_LEVEL.public,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };
      expect(() => validate(body, postRoomBodySchema)).not.toThrow();
    });
  });

  describe('when the body contains the required data and the access is private', () => {
    it('should pass validation', () => {
      const body = {
        name: 'my room',
        slug: '',
        access: ROOM_ACCESS_LEVEL.private,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the room name', () => {
    it('should throw', () => {
      const body = {
        slug: '',
        access: ROOM_ACCESS_LEVEL.public,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the slug', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        access: ROOM_ACCESS_LEVEL.public,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body contains a null slug ', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: null,
        access: ROOM_ACCESS_LEVEL.public,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the access', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: '',
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body contains an unknown access', () => {
    it('should throw', () => {
      const body = {
        name: 'def',
        slug: '',
        access: 'unknown access',
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });
});

describe('patchRoomBodySchema', () => {
  describe('when the body contains the required data', () => {
    it('should pass validation', () => {
      const body = {
        name: 'my room',
        slug: '',
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };
      expect(() => validate(body, patchRoomBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the room name', () => {
    it('should throw', () => {
      const body = {
        slug: '',
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, patchRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the slug', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      expect(() => validate(body, patchRoomBodySchema)).toThrow();
    });
  });

  describe('when the body contains a null slug ', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: null
      };

      expect(() => validate(body, patchRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the lessonsMode', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: ''
      };

      expect(() => validate(body, patchRoomBodySchema)).toThrow();
    });
  });
});

describe('postRoomInvitationBodySchema', () => {
  describe('when the body contains the required data', () => {
    it('should pass validation', () => {
      expect(() => validate({ roomId: '29c29c78n8uih9cqh9huhf324', email: 'x@y.com' }, postRoomInvitationBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the id', () => {
    it('should throw', () => {
      expect(() => validate({ email: 'x@y.com', roomId: '' }, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the email', () => {
    it('should throw', () => {
      expect(() => validate({ email: '', roomId: '29c29c78n8uih9cqh9huhf324' }, postRoomBodySchema)).toThrow();
    });
  });
});
