import uniqueId from './unique-id.js';
import { canEditDocContent, canEditDocMetadata, groupCommentsByTopic } from './doc-utils.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOCUMENT_ORIGIN, ROLE, ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

describe('doc-utils', () => {
  let doc;
  let user;
  let room;

  describe('canEditDocContent', () => {
    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [] };
      room = { owner: user._id, members: [], documentsMode: ROOM_DOCUMENTS_MODE.collaborative };
      doc = { origin: DOCUMENT_ORIGIN.internal, archived: false, allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent };
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDocContent({ user, doc, room })).toBe(false);
    });

    describe(`when the user has '${ROLE.admin}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.admin];
      });

      it('should return false when the doc is external', () => {
        doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
        expect(canEditDocContent({ user, doc, room })).toBe(false);
      });

      it('should return false when the doc is archived', () => {
        doc.archived = true;
        expect(canEditDocContent({ user, doc, room })).toBe(false);
      });

      it('should still return true even when the user is neither room owner nor collaborator', () => {
        room.owner = uniqueId.create();
        expect(canEditDocContent({ user, doc, room })).toBe(true);
      });

      it('should return true when the document is not within a room', () => {
        room = null;
        expect(canEditDocContent({ user, doc, room })).toBe(true);
      });
    });

    describe(`when the user has '${ROLE.maintainer}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.maintainer];
      });

      it('should return false when the doc is external', () => {
        doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
        expect(canEditDocContent({ user, doc, room })).toBe(false);
      });

      it('should return false when the doc is archived', () => {
        doc.archived = true;
        expect(canEditDocContent({ user, doc, room })).toBe(false);
      });

      it('should still return true even when the user is neither room owner nor collaborator', () => {
        room.owner = uniqueId.create();
        expect(canEditDocContent({ user, doc, room })).toBe(true);
      });

      it('should return true when the document is not within a room', () => {
        room = null;
        expect(canEditDocContent({ user, doc, room })).toBe(true);
      });
    });

    describe(`when the user has '${ROLE.user}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.user];
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return true when the doc is not in a room', () => {
          room = null;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return true when the doc is not in a room', () => {
          room = null;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(true);
        });
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is not in a room', () => {
          room = null;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocContent({ user, doc, room })).toBe(false);
        });
      });
    });
  });

  describe('canEditDocMetadata', () => {
    beforeEach(() => {
      user = { _id: uniqueId.create(), roles: [] };
      room = { owner: user._id, members: [], documentsMode: ROOM_DOCUMENTS_MODE.collaborative };
      doc = { origin: DOCUMENT_ORIGIN.internal, archived: false, allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent };
    });

    it('should return false when the user is not provided', () => {
      user = null;
      expect(canEditDocMetadata({ user, doc, room })).toBe(false);
    });

    describe(`when the user has '${ROLE.admin}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.admin];
      });

      it('should return false when the doc is external', () => {
        doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
        expect(canEditDocMetadata({ user, doc, room })).toBe(false);
      });

      it('should return false when the doc is archived', () => {
        doc.archived = true;
        expect(canEditDocMetadata({ user, doc, room })).toBe(false);
      });

      it('should still return true even when the user is neither room owner nor collaborator', () => {
        room.owner = uniqueId.create();
        expect(canEditDocMetadata({ user, doc, room })).toBe(true);
      });

      it('should return true when the document is not within a room', () => {
        room = null;
        expect(canEditDocMetadata({ user, doc, room })).toBe(true);
      });
    });

    describe(`when the user has '${ROLE.maintainer}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.maintainer];
      });

      it('should return false when the doc is external', () => {
        doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
        expect(canEditDocMetadata({ user, doc, room })).toBe(false);
      });

      it('should return false when the doc is archived', () => {
        doc.archived = true;
        expect(canEditDocMetadata({ user, doc, room })).toBe(false);
      });

      it('should still return true even when the user is neither room owner nor collaborator', () => {
        room.owner = uniqueId.create();
        expect(canEditDocMetadata({ user, doc, room })).toBe(true);
      });

      it('should return true when the document is not within a room', () => {
        room = null;
        expect(canEditDocMetadata({ user, doc, room })).toBe(true);
      });
    });

    describe(`when the user has '${ROLE.user}' role`, () => {
      beforeEach(() => {
        user.roles = [ROLE.user];
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return true when the doc is not in a room', () => {
          room = null;
          expect(canEditDocMetadata({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocMetadata({ user, doc, room })).toBe(true);
        });

        it('should return true when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(true);
        });
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is not in a room', () => {
          room = null;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });
      });

      describe(`and the doc has allowedOpenContribution set to '${DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none}'`, () => {
        beforeEach(() => {
          doc.allowedOpenContribution = DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none;
        });

        it('should return false when the doc is external', () => {
          doc.origin = `${DOCUMENT_ORIGIN.external}-educandu`;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is archived', () => {
          doc.archived = true;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is neither room owner nor collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: uniqueId.create() }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room member but not collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the doc is not in a room', () => {
          room = null;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room owner', () => {
          room.owner = user._id;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });

        it('should return false when the user is room collaborator', () => {
          room.owner = uniqueId.create();
          room.members = [{ userId: user._id }];
          room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
          expect(canEditDocMetadata({ user, doc, room })).toBe(false);
        });
      });
    });
  });

  describe('groupCommentsByTopic', () => {
    let result;

    describe('when comments are empty string', () => {
      beforeEach(() => {
        result = groupCommentsByTopic([]);
      });
      it('should return empty object', () => {
        expect(result).toEqual({});
      });
    });

    describe('when comments of multiple topics are provided', () => {
      let comments;
      beforeEach(() => {
        comments = [
          { _id: 11, topic: 'topic-1', createdOn: new Date() },
          { _id: 12, topic: 'topic-1', createdOn: new Date() },
          { _id: 21, topic: 'topic-2', createdOn: new Date() },
          { _id: 22, topic: 'topic-2', createdOn: new Date() }
        ];
        result = groupCommentsByTopic(comments);
      });
      it('should return a grouping sorted by most recently active topics ascending and within each topic the comments sorted descending by createdOn', () => {
        expect(result).toEqual({
          'topic-2': [comments[2], comments[3]],
          'topic-1': [comments[0], comments[1]]
        });
      });
    });
  });
});
