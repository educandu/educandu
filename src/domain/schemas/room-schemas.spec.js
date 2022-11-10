import { validate } from '../validation.js';
import { ROOM_DOCUMENTS_MODE } from '../constants.js';
import { postRoomBodySchema, patchRoomMetadataBodySchema, postRoomInvitationsBodySchema } from './room-schemas.js';

describe('postRoomBodySchema', () => {
  describe('when the body contains the required data', () => {
    it('should pass validation', () => {
      const body = {
        name: 'my room',
        slug: '',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };
      expect(() => validate(body, postRoomBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the room name', () => {
    it('should throw', () => {
      const body = {
        slug: '',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the slug', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body contains a null slug ', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: null,
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };

      expect(() => validate(body, postRoomBodySchema)).toThrow();
    });
  });
});

describe('patchRoomMetadataBodySchema', () => {
  describe('when the body contains the required data', () => {
    it('should pass validation', () => {
      const body = {
        name: 'my room',
        slug: '',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };
      expect(() => validate(body, patchRoomMetadataBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the room name', () => {
    it('should throw', () => {
      const body = {
        slug: '',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };

      expect(() => validate(body, patchRoomMetadataBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the slug', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive
      };

      expect(() => validate(body, patchRoomMetadataBodySchema)).toThrow();
    });
  });

  describe('when the body contains a null slug ', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: null
      };

      expect(() => validate(body, patchRoomMetadataBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain the documentsMode', () => {
    it('should throw', () => {
      const body = {
        name: 'my room',
        slug: ''
      };

      expect(() => validate(body, patchRoomMetadataBodySchema)).toThrow();
    });
  });
});

describe('postRoomInvitationBodySchema', () => {
  describe('when the body contains the required data', () => {
    it('should pass validation', () => {
      expect(() => validate({ roomId: '29c29c78n8uih9cqh9huhf324', emails: ['x@y.com'] }, postRoomInvitationsBodySchema)).not.toThrow();
    });
  });

  describe('when the body does not contain the id', () => {
    it('should throw', () => {
      expect(() => validate({ emails: ['x@y.com'], roomId: '' }, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body does not contain any email', () => {
    it('should throw', () => {
      expect(() => validate({ emails: [], roomId: '29c29c78n8uih9cqh9huhf324' }, postRoomBodySchema)).toThrow();
    });
  });

  describe('when the body contains an invalid email', () => {
    it('should throw', () => {
      expect(() => validate({ emails: ['x@y.com', 'not@valid'], roomId: '29c29c78n8uih9cqh9huhf324' }, postRoomBodySchema)).toThrow();
    });
  });
});
