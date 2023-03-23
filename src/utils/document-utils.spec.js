import uniqueId from './unique-id.js';
import { ROLE } from '../domain/constants.js';
import { canEditDocument } from './document-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';

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
        room = { _id: uniqueId.create(), owner: uniqueId.create(), members: [], isCollaborative: false };
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
        room.owner = user._id;
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
        doc.publicContext = { archived: false, protected: false, accreditedEditors: [] };
      });

      it('should return false when the public document does not allow editing', () => {
        doc.publicContext.protected = true;
        expect(canEditDocument({ user, doc, room: null })).toBe(false);
      });

      it(`should return false when the public document does not allow editing but the user is a ${ROLE.maintainer}`, () => {
        doc.publicContext.protected = true;
        user.role = ROLE.maintainer;
        expect(canEditDocument({ user, doc, room: null })).toBe(true);
      });

      it(`should return false when the public document does not allow editing but the user is an ${ROLE.admin}`, () => {
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
});
