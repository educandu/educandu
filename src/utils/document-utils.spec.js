import uniqueId from './unique-id.js';
import { ROLE } from '../domain/constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { canEditDocument, canRestoreDocumentRevisions } from './document-utils.js';

describe('document-utils', () => {
  let doc;
  let user;
  let room;

  describe('canEditDocument', () => {
    beforeEach(() => {
      doc = {};
      room = null;
      user = { _id: uniqueId.create(), role: '' };
    });

    it('should throw when no document is not provided', () => {
      doc = null;
      expect(() => canEditDocument({ user, doc, room })).toThrow(Error);
    });

    it('should throw when the document has a room ID but the room is not provided', () => {
      doc.roomId = uniqueId.create();
      expect(() => canEditDocument({ user, doc, room })).toThrow(Error);
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDocument({ user, doc, room })).toBe(false);
    });

    describe('if the document is in a room', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), ownedBy: uniqueId.create(), members: [], isCollaborative: false };
        doc.roomContext = { draft: false };
        doc.roomId = room._id;
      });

      it('should return false when the user is not owner or collaborator of the room', () => {
        expect(canEditDocument({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is collaborator of the room and the document is not a draft', () => {
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canEditDocument({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is collaborator of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canEditDocument({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is owner of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.ownedBy = user._id;
        room.isCollaborative = true;
        expect(canEditDocument({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is only a member of the room', () => {
        room.member = [{ userId: user._id }];
        room.isCollaborative = false;
        expect(canEditDocument({ user, doc, room })).toBe(false);
      });
    });

    describe('if the document is public', () => {
      beforeEach(() => {
        doc.publicContext = { archived: false, protected: false, allowedEditors: [] };
      });

      it('should return false when the public document does not allow editing', () => {
        doc.publicContext.protected = true;
        expect(canEditDocument({ user, doc, room: null })).toBe(false);
      });

      it(`should return true when the public document does not allow editing but the user is a ${ROLE.maintainer}`, () => {
        doc.publicContext.protected = true;
        user.role = ROLE.maintainer;
        expect(canEditDocument({ user, doc, room: null })).toBe(true);
      });

      it(`should return true when the public document does not allow editing but the user is an ${ROLE.admin}`, () => {
        doc.publicContext.protected = true;
        user.role = ROLE.admin;
        expect(canEditDocument({ user, doc, room: null })).toBe(true);
      });

      it('should return true when the public document allows editing', () => {
        doc.publicContext.protected = false;
        expect(canEditDocument({ user, doc, room: null })).toBe(true);
      });

      it('should return false when the document is archived', () => {
        doc.publicContext.archived = true;
        expect(canEditDocument({ user, doc, room })).toBe(false);
      });
    });
  });

  describe('canRestoreDocumentRevisions', () => {
    beforeEach(() => {
      doc = {};
      room = null;
      user = { _id: uniqueId.create(), role: '' };
    });

    it('should throw when no document is not provided', () => {
      doc = null;
      expect(() => canRestoreDocumentRevisions({ user, doc, room })).toThrow(Error);
    });

    it('should throw when the document has a room ID but the room is not provided', () => {
      doc.roomId = uniqueId.create();
      expect(() => canRestoreDocumentRevisions({ user, doc, room })).toThrow(Error);
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
    });

    describe('if the document is in a room', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), ownedBy: uniqueId.create(), members: [], isCollaborative: false };
        doc.roomContext = { draft: false };
        doc.roomId = room._id;
      });

      it('should return false when the user is not owner or collaborator of the room', () => {
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is collaborator of the room and the document is not a draft', () => {
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is collaborator of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is owner of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.ownedBy = user._id;
        room.isCollaborative = true;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is only a member of the room', () => {
        room.member = [{ userId: user._id }];
        room.isCollaborative = false;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
      });

      it(`should return false even if the user is only a member even if it has a ${ROLE.maintainer} role`, () => {
        room.member = [{ userId: user._id }];
        room.isCollaborative = false;
        user.role = ROLE.maintainer;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
      });

      it(`should return false even if the user is only a member even if it has an ${ROLE.admin} role`, () => {
        room.member = [{ userId: user._id }];
        room.isCollaborative = false;
        user.role = ROLE.admin;
        expect(canRestoreDocumentRevisions({ user, doc, room })).toBe(false);
      });
    });

    describe('if the document is public', () => {
      beforeEach(() => {
        doc.publicContext = { archived: false, protected: false, allowedEditors: [] };
      });

      it('should return false when the document is public', () => {
        doc.publicContext = {};
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(false);
      });

      it(`should return true when the public document is protected but the user is a ${ROLE.maintainer}`, () => {
        doc.publicContext.protected = true;
        user.role = ROLE.maintainer;
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });

      it(`should return true when the public document is protected but the user is an ${ROLE.admin}`, () => {
        doc.publicContext.protected = true;
        user.role = ROLE.admin;
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });

      it('should return true when the public document is protected but the user is an allowed editor', () => {
        doc.publicContext.protected = true;
        doc.publicContext.allowedEditors = [{ _id: user._id }];
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });

      it(`should return true when the public document is archived but the user is a ${ROLE.maintainer}`, () => {
        doc.publicContext.archived = true;
        user.role = ROLE.maintainer;
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });

      it(`should return true when the public document is archived but the user is an ${ROLE.admin}`, () => {
        doc.publicContext.archived = true;
        user.role = ROLE.admin;
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });

      it('should return true when the public document is archived but the user is an allowed editor', () => {
        doc.publicContext.archived = true;
        doc.publicContext.allowedEditors = [{ _id: user._id }];
        expect(canRestoreDocumentRevisions({ user, doc, room: null })).toBe(true);
      });
    });
  });
});
