import { validate } from '../validation.js';
import { ROOM_ACCESS_LEVEL } from '../../common/constants.js';
import {
  roomInvitationSchema,
  roomSchema
} from './rooms-schemas.js';

describe('roomsSchema', () => {
  let incompleteBody = null;

  describe('when body contains correct data', () => {
    beforeEach(() => {
      incompleteBody = {
        name: 'my room',
        owner: 'some user id'
      };
    });

    describe('and the room is public', () => {
      it('should pass validation', () => {
        const completeBody = {
          ...incompleteBody,
          access: ROOM_ACCESS_LEVEL.public
        };
        expect(() => validate(completeBody, roomSchema)).not.toThrow();
      });
    });

    describe('and the room is private', () => {
      it('should pass validation', () => {
        const completeBody = {
          ...incompleteBody,
          access: ROOM_ACCESS_LEVEL.private
        };

        expect(() => validate(completeBody, roomSchema)).not.toThrow();
      });
    });
  });

  describe('wnen the room has incomplete data', () => {
    describe('when the room name is missing', () => {
      it('should throw', () => {
        incompleteBody = {
          owner: 'owner1',
          access: ROOM_ACCESS_LEVEL.public
        };

        expect(() => validate(incompleteBody, roomSchema)).toThrow();
      });
    });

    describe('when the room owner is missing', () => {
      it('should throw', () => {
        incompleteBody = {
          name: 'my room',
          access: ROOM_ACCESS_LEVEL.public
        };

        expect(() => validate(incompleteBody, roomSchema)).toThrow();
      });
    });

    describe('when the access is missing', () => {
      it('should throw', () => {
        incompleteBody = {
          name: 'my room',
          owner: 'owner1'
        };

        expect(() => validate(incompleteBody, roomSchema)).toThrow();
      });
    });
  });

  describe('when the room has an unsupported access level', () => {
    it('should throw', () => {
      const invalidAccess = {
        owner: 'abc',
        name: 'def',
        access: 'random access'
      };

      expect(() => validate(invalidAccess, roomSchema)).toThrow();
    });
  });
});

describe('roomInvitationSchema', () => {
  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate({ roomId: 'abc', userId: 'def' }, roomInvitationSchema)).not.toThrow();
    });
  });

  describe('wnen the room has incomplete data', () => {
    describe('when the room id is missing', () => {
      it('should throw', () => {
        expect(() => validate({ userId: '1', roomId: '' }, roomSchema)).toThrow();
      });
    });

    describe('when the user id is missing', () => {
      it('should throw', () => {
        expect(() => validate({ userId: '', roomId: 'my room' }, roomSchema)).toThrow();
      });
    });

  });
});
