import uniqueId from './unique-id.js';
import { canEditDocContent, canEditDocMetadata } from './doc-utils.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, ROLE, ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

describe('doc-utils', () => {
  let doc;
  let user;
  let room;

  describe('canEditDocContent', () => {
    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [] };
      room = { owner: user._id, members: [], documentsMode: ROOM_DOCUMENTS_MODE.collaborative };
      doc = { archived: false, allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent };
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDocContent({ user, doc, room })).toBe(false);
    });

    it('should return false when the document is archived', () => {
      doc.archived = true;
      expect(canEditDocContent({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is not owner or collaborator of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      expect(canEditDocContent({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is only a member of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      room.member = [{ userId: user._id }];
      room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
      expect(canEditDocContent({ user, doc, room })).toBe(false);
    });

    it('should return false when the public document does not allow content or metadata editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      expect(canEditDocContent({ user, doc, room: null })).toBe(false);
    });

    it(`should return false when the public document does not allow content or metadata editing but the user is a ${ROLE.maintainer}`, () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      user.roles = [ROLE.maintainer];
      expect(canEditDocContent({ user, doc, room: null })).toBe(true);
    });

    it(`should return false when the public document does not allow content or metadata editing but the user is an ${ROLE.admin}`, () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      user.roles = [ROLE.admin];
      expect(canEditDocContent({ user, doc, room: null })).toBe(true);
    });

    it('should return true when the public document allows metadata and content editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent;
      expect(canEditDocContent({ user, doc, room: null })).toBe(true);
    });

    it('should return true when the public document allows content editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content;
      expect(canEditDocContent({ user, doc, room: null })).toBe(true);
    });
  });

  describe('canEditDocMetadata', () => {
    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [] };
      room = { owner: user._id, members: [], documentsMode: ROOM_DOCUMENTS_MODE.collaborative };
      doc = { archived: false, allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent };
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDocMetadata({ user, doc, room })).toBe(false);
    });

    it('should return false when the document is archived', () => {
      doc.archived = true;
      expect(canEditDocMetadata({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is not owner or collaborator of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      expect(canEditDocMetadata({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is only a member of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      room.member = [{ userId: user._id }];
      room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
      expect(canEditDocMetadata({ user, doc, room })).toBe(false);
    });

    it('should return false when the public document does not allow content or metadata editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      expect(canEditDocMetadata({ user, doc, room: null })).toBe(false);
    });

    it('should return false when the public document does not allow metadata editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content;
      expect(canEditDocMetadata({ user, doc, room: null })).toBe(false);
    });

    it(`should return false when the public document does not allow content or metadata editing but the user is a ${ROLE.maintainer}`, () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      user.roles = [ROLE.maintainer];
      expect(canEditDocMetadata({ user, doc, room: null })).toBe(true);
    });

    it(`should return false when the public document does not allow content or metadata editing but the user is an ${ROLE.admin}`, () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
      user.roles = [ROLE.admin];
      expect(canEditDocMetadata({ user, doc, room: null })).toBe(true);
    });

    it('should return true when the public document allows metadata and content editing', () => {
      doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent;
      expect(canEditDocMetadata({ user, doc, room: null })).toBe(true);
    });
  });
});
