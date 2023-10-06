import httpErrors from 'http-errors';
import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import { ROLE } from '../domain/constants.js';
import DocumentInputService from './document-input-service.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDocument,
  createTestRoom,
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  createTestUser,
  createTestDocumentInput
} from '../test-helper.js';
import uniqueId from '../utils/unique-id.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

describe('document-input-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let container;
  let otherUser;
  let user;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await createTestUser(container, { email: 'user@test.com', role: ROLE.user });
    otherUser = await createTestUser(container, { email: 'other_user@test.com', role: ROLE.user });

    db = container.get(Database);
    sut = container.get(DocumentInputService);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getDocumentInputById', () => {
    let room;
    let result;
    let document;
    let documentInput;

    describe('when the document input does not exist', () => {
      it('should throw NotFound', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: uniqueId.create(), user })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document no longer exists', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [{ userId: user._id, joinedOn: now }]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });
        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await db.documents.deleteOne({ _id: document._id });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: documentInput._id, user })).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is a room member, the room is no longer collaborative, and the user is not the creator of the documentInput', () => {
      let otherDocumentInput;

      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        otherDocumentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: otherDocumentInput._id, user })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a room member, the room is no longer collaborative, and the user is the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: user._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: user._id,
          updatedOn: now
        });
      });
    });

    describe('when the user is the room owner and not the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          { isCollaborative: true,
            ownedBy: user._id,
            members: [{ userId: otherUser._id, joinedOn: now }] }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null

        });
        documentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: otherUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: otherUser._id,
          updatedOn: now
        });
      });
    });

    describe('when the user is a room collaborator and not the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });
        documentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: otherUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: otherUser._id,
          updatedOn: now
        });
      });
    });

  });

  describe('createDocumentInput', () => {
    let room;
    let result;
    let document;

    describe('when the document does not exist', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [{ userId: user._id, joinedOn: now }]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        await db.documents.deleteOne({ _id: document._id });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          user
        })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document is not part of a room', () => {
      beforeEach(async () => {
        document = await createTestDocument(container, user, {
          roomContext: null,
          publicContext: {}
        });
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          user
        })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the user is a room member', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: false,
            ownedBy: otherUser._id,
            members: [{ userId: user._id, joinedOn: now }]
          }
        );
        document = await createTestDocument(container, otherUser, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        result = await sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          user
        });
      });

      it('should return the created document input', () => {
        expect(result).toEqual({
          _id: expect.any(String),
          createdBy: user._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: user._id,
          updatedOn: now
        });
      });
    });
  });

  describe('hardDeleteDocumentInput', () => {
    let room;
    let result;
    let document;
    let documentInput;

    describe('when the document input does not exist', () => {
      it('should throw NotFound', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: uniqueId.create(), user })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document no longer exists', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [{ userId: user._id, joinedOn: now }]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });
        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await db.documents.deleteOne({ _id: documentInput.documentId });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user })).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is a room member, the room is no longer collaborative, and the user is not the creator of the documentInput', () => {
      let otherDocumentInput;

      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        otherDocumentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: otherDocumentInput._id, user })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a room member, the room is no longer collaborative, and the user is the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });

        documentInput = await createTestDocumentInput(container, user, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });

    describe('when the user is the room owner and not the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          { isCollaborative: true,
            ownedBy: user._id,
            members: [{ userId: otherUser._id, joinedOn: now }] }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null

        });
        documentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });

    describe('when the user is a room collaborator and not the creator of the documentInput', () => {
      beforeEach(async () => {
        room = await createTestRoom(
          container,
          {
            isCollaborative: true,
            ownedBy: uniqueId.create(),
            members: [
              { userId: user._id, joinedOn: now },
              { userId: otherUser._id, joinedOn: now }
            ]
          }
        );
        document = await createTestDocument(container, user, {
          roomId: room._id,
          roomContext: { draft: false },
          publicContext: null
        });
        documentInput = await createTestDocumentInput(container, otherUser, {
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {}
        });

        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });
  });
});
