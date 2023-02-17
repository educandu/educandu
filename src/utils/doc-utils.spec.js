import uniqueId from './unique-id.js';
import { canEditDoc } from './doc-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { ROLE, ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

describe('doc-utils', () => {
  let doc;
  let user;
  let room;

  describe('canEditDoc', () => {
    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [] };
      room = { owner: user._id, members: [], documentsMode: ROOM_DOCUMENTS_MODE.collaborative };
      doc = { publicContext: { protected: false, archived: false } };
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDoc({ user, doc, room })).toBe(false);
    });

    it('should return false when the document is archived', () => {
      doc.publicContext.archived = true;
      expect(canEditDoc({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is not owner or collaborator of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      expect(canEditDoc({ user, doc, room })).toBe(false);
    });

    it('should return false when the private document is in a room that the user is only a member of', () => {
      doc.roomId = room._id;
      room.owner = uniqueId.create();
      room.member = [{ userId: user._id }];
      room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
      expect(canEditDoc({ user, doc, room })).toBe(false);
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
  });
});
