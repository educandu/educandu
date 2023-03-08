import uniqueId from './unique-id.js';
import { canEditDoc } from './doc-utils.js';
import { ROLE } from '../domain/constants.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('doc-utils', () => {
  let doc;
  let user;
  let room;

  describe('canEditDoc', () => {
    beforeEach(() => {
      doc = {};
      room = null;
      user = { _id: uniqueId.create(), roles: [] };
    });

    it('should throw when no document is not provided', () => {
      doc = null;
      expect(() => canEditDoc({ user, doc, room })).toThrow(Error);
    });

    it('should throw when the document has a room ID but the room is not provided', () => {
      doc.roomId = uniqueId.create();
      expect(() => canEditDoc({ user, doc, room })).toThrow(Error);
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDoc({ user, doc, room })).toBe(false);
    });

    describe('if the document is in a room', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), owner: uniqueId.create(), members: [], isCollaborative: false };
        doc.roomContext = { draft: false };
        doc.roomId = room._id;
      });

      it('should return false when the user is not owner or collaborator of the room', () => {
        expect(canEditDoc({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is collaborator of the room and the document is not a draft', () => {
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canEditDoc({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is collaborator of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.members = [{ userId: user._id }];
        room.isCollaborative = true;
        expect(canEditDoc({ user, doc, room })).toBe(false);
      });

      it('should return true when the user is owner of the room and the document is a draft', () => {
        doc.roomContext.draft = true;
        room.owner = user._id;
        room.isCollaborative = true;
        expect(canEditDoc({ user, doc, room })).toBe(true);
      });

      it('should return false when the user is only a member of the room', () => {
        room.member = [{ userId: user._id }];
        room.isCollaborative = false;
        expect(canEditDoc({ user, doc, room })).toBe(false);
      });
    });

    describe('if the document is public', () => {
      beforeEach(() => {
        doc.publicContext = { archived: false, protected: false, accreditedEditors: [] };
      });

      it('should return false when the public document does not allow editing', () => {
        doc.publicContext.protected = true;
        expect(canEditDoc({ user, doc, room: null })).toBe(false);
      });

      it(`should return false when the public document does not allow editing but the user is a ${ROLE.maintainer}`, () => {
        doc.publicContext.protected = true;
        user.roles = [ROLE.maintainer];
        expect(canEditDoc({ user, doc, room: null })).toBe(true);
      });

      it(`should return false when the public document does not allow editing but the user is an ${ROLE.admin}`, () => {
        doc.publicContext.protected = true;
        user.roles = [ROLE.admin];
        expect(canEditDoc({ user, doc, room: null })).toBe(true);
      });

      it('should return true when the public document allows editing', () => {
        doc.publicContext.protected = false;
        expect(canEditDoc({ user, doc, room: null })).toBe(true);
      });

      it('should return false when the document is archived', () => {
        doc.publicContext.archived = true;
        expect(canEditDoc({ user, doc, room })).toBe(false);
      });
    });
  });
});
