import { validate } from '../validation.js';
import { ROOM_ACCESS_LEVEL } from '../../common/constants.js';
import { postRoomBodySchema, postRoomInvitationBodySchema } from './rooms-schemas.js';

describe('postRoomBodySchema', () => {
  let incompleteBody = null;

  describe('when body contains correct data', () => {
    beforeEach(() => {
      incompleteBody = {
        name: 'my room'
      };
    });

    describe('and the room is public', () => {
      it('should pass validation', () => {
        const completeBody = {
          ...incompleteBody,
          access: ROOM_ACCESS_LEVEL.public
        };
        expect(() => validate(completeBody, postRoomBodySchema)).not.toThrow();
      });
    });

    describe('and the room is private', () => {
      it('should pass validation', () => {
        const completeBody = {
          ...incompleteBody,
          access: ROOM_ACCESS_LEVEL.private
        };

        expect(() => validate(completeBody, postRoomBodySchema)).not.toThrow();
      });
    });
  });

  describe('when the room has incomplete data', () => {
    describe('when the room name is missing', () => {
      it('should throw', () => {
        incompleteBody = {
          access: ROOM_ACCESS_LEVEL.public
        };

        expect(() => validate(incompleteBody, postRoomBodySchema)).toThrow();
      });
    });

    describe('and the access is missing', () => {
      it('should throw', () => {
        incompleteBody = {
          name: 'my room',
          owner: 'f74jr8gjg7ehr8jrif3264'
        };

        expect(() => validate(incompleteBody, postRoomBodySchema)).toThrow();
      });
    });
  });

  describe('when the room has an unsupported access level', () => {
    it('should throw', () => {
      const invalidAccess = {
        name: 'def',
        access: 'random access'
      };

      expect(() => validate(invalidAccess, postRoomBodySchema)).toThrow();
    });
  });
});

describe('postRoomInvitationBodySchema', () => {
  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate({ roomId: '29c29c78n8uih9cqh9huhf324', email: 'x@y.com' }, postRoomInvitationBodySchema)).not.toThrow();
    });
  });

  describe('wnen the room has incomplete data', () => {
    describe('when the room id is missing', () => {
      it('should throw', () => {
        expect(() => validate({ email: 'x@y.com', roomId: '' }, postRoomBodySchema)).toThrow();
      });
    });

    describe('when the email is missing', () => {
      it('should throw', () => {
        expect(() => validate({ email: '', roomId: '29c29c78n8uih9cqh9huhf324' }, postRoomBodySchema)).toThrow();
      });
    });

  });
});
