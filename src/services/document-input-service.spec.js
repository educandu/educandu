import httpErrors from 'http-errors';
import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
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
  createTestDocumentInput,
  hardDeletePrivateTestDocument,
  updateTestDocument
} from '../test-helper.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

describe('document-input-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let container;
  let roomOwnerUser;
  let inputtingUser;
  let nonInputtingUser;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    roomOwnerUser = await createTestUser(container, { email: 'room_owner_user@test.com', role: ROLE.user });
    inputtingUser = await createTestUser(container, { email: 'inputting_user@test.com', role: ROLE.user });
    nonInputtingUser = await createTestUser(container, { email: 'non_inputting_user@test.com', role: ROLE.user });

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

    beforeEach(async () => {
      room = await createTestRoom(
        container,
        {
          isCollaborative: true,
          ownedBy: roomOwnerUser._id,
          members: [
            { userId: inputtingUser._id, joinedOn: now },
            { userId: nonInputtingUser._id, joinedOn: now }
          ]
        }
      );
      document = await createTestDocument(container, roomOwnerUser, {
        roomId: room._id,
        roomContext: { draft: false, inputSubmittingDisabled: false },
        publicContext: null
      });
      documentInput = await createTestDocumentInput(container, inputtingUser, {
        documentId: document._id,
        documentRevisionId: document.revision,
        sections: {}
      });
    });

    describe('when the document input does not exist', () => {
      it('should throw NotFound', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: uniqueId.create(), user: inputtingUser })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document no longer exists', () => {
      beforeEach(async () => {
        await hardDeletePrivateTestDocument({ container, documentId: document._id, user: roomOwnerUser });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: documentInput._id, user: inputtingUser })).rejects.toThrow(NotFound);
      });
    });

    describe('when room is collaborative and the user is a room member but not the creator of the documentInput', () => {
      beforeEach(async () => {
        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user: nonInputtingUser });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: inputtingUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: inputtingUser._id,
          updatedOn: now
        });
      });
    });

    describe('when the room is no longer collaborative and the user is a room member and the creator of the documentInput', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user: inputtingUser });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: inputtingUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: inputtingUser._id,
          updatedOn: now
        });
      });
    });

    describe('when the room is no longer collaborative and the user is a room member but not the creator of the documentInput', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.getDocumentInputById({ documentInputId: documentInput._id, user: nonInputtingUser })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room is no longer collaborative and the user is the room owner but not the creator of the documentInput', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
        result = await sut.getDocumentInputById({ documentInputId: documentInput._id, user: roomOwnerUser });
      });

      it('should return the document input', () => {
        expect(result).toEqual({
          _id: documentInput._id,
          createdBy: inputtingUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: inputtingUser._id,
          updatedOn: now
        });
      });
    });
  });

  describe('createDocumentInput', () => {
    let room;
    let result;
    let document;

    beforeEach(async () => {
      room = await createTestRoom(
        container,
        {
          isCollaborative: true,
          ownedBy: roomOwnerUser._id,
          members: [
            { userId: inputtingUser._id, joinedOn: now },
            { userId: nonInputtingUser._id, joinedOn: now }
          ]
        }
      );
      document = await createTestDocument(container, roomOwnerUser, {
        roomId: room._id,
        roomContext: { draft: false, inputSubmittingDisabled: false },
        publicContext: null
      });
    });

    describe('when the document no longer exists', () => {
      beforeEach(async () => {
        await hardDeletePrivateTestDocument({ container, documentId: document._id, user: roomOwnerUser });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          user: inputtingUser
        })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document and document revision IDs do not match', () => {
      let otherDocument;
      beforeEach(async () => {
        otherDocument = await createTestDocument(container, roomOwnerUser, {
          roomContext: null,
          publicContext: {}
        });
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: otherDocument.revision,
          sections: {},
          user: inputtingUser
        })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the document revision does not allow submitting input', () => {
      let updatedDocument;
      beforeEach(async () => {
        updatedDocument = await updateTestDocument({
          container,
          documentId: document._id,
          data: {
            roomContext: {
              draft: false,
              inputSubmittingDisabled: true
            }
          },
          user: roomOwnerUser
        });
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: updatedDocument._id,
          documentRevisionId: updatedDocument.revision,
          sections: {},
          user: inputtingUser
        })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the document is not part of a room', () => {
      let publicDocument;
      beforeEach(async () => {
        publicDocument = await createTestDocument(container, inputtingUser, {
          roomContext: null,
          publicContext: {}
        });
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.createDocumentInput({
          documentId: publicDocument._id,
          documentRevisionId: publicDocument.revision,
          sections: {},
          user: inputtingUser
        })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the room is no longer collaborative and the user is a room member', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
        result = await sut.createDocumentInput({
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          user: inputtingUser
        });
      });

      it('should return the created document input', () => {
        expect(result).toEqual({
          _id: expect.any(String),
          createdBy: inputtingUser._id,
          createdOn: now,
          documentId: document._id,
          documentRevisionId: document.revision,
          sections: {},
          updatedBy: inputtingUser._id,
          updatedOn: now
        });
      });
    });
  });

  describe('createDocumentInputSectionComment', () => {
    let room;
    let result;
    let document;
    let sectionKey;
    let documentInput;

    beforeEach(async () => {
      room = await createTestRoom(
        container,
        {
          isCollaborative: true,
          ownedBy: roomOwnerUser._id,
          members: [
            { userId: inputtingUser._id, joinedOn: now },
            { userId: nonInputtingUser._id, joinedOn: now }
          ]
        }
      );
      document = await createTestDocument(container, roomOwnerUser, {
        roomId: room._id,
        roomContext: { draft: false, inputSubmittingDisabled: false },
        publicContext: null
      });
      sectionKey = 'SAQVpmre63mCHqeCUiEbNR';
      documentInput = await createTestDocumentInput(container, inputtingUser, {
        documentId: document._id,
        documentRevisionId: document.revision,
        sections: {
          [sectionKey]: {
            data: {},
            files: [],
            comments: []
          }
        }
      });
    });

    describe('when the document input no longer exists', () => {
      beforeEach(async () => {
        await db.documentInputs.deleteOne({ _id: documentInput._id });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey,
          text: 'First comment',
          user: inputtingUser
        })).rejects.toThrow(NotFound);
      });
    });

    describe('when the section key does not exist', () => {
      it('should throw BadRequest', async () => {
        await expect(() => sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey: 'sectionKey-x',
          text: 'First comment',
          user: inputtingUser
        })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the room is no longer collaborative and the user is another room member', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey,
          text: 'First comment',
          user: nonInputtingUser
        })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room owner is posting a comment', () => {
      beforeEach(async () => {
        result = await sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey,
          text: 'First comment',
          user: roomOwnerUser
        });
      });

      it('should return the updated document input', () => {
        expect(result).toEqual({
          ...documentInput,
          sections: {
            ...documentInput.sections,
            [sectionKey]: {
              ...documentInput.sections[sectionKey],
              comments: [
                {
                  key: expect.any(String),
                  createdBy: roomOwnerUser._id,
                  createdOn: now,
                  deletedBy: null,
                  deletedOn: null,
                  text: 'First comment'
                }
              ]
            }
          }
        });
      });
    });

    describe('when a room collaborator is posting a comment', () => {
      beforeEach(async () => {
        result = await sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey,
          text: 'First comment',
          user: nonInputtingUser
        });
      });

      it('should return the updated document input', () => {
        expect(result).toEqual({
          ...documentInput,
          sections: {
            ...documentInput.sections,
            [sectionKey]: {
              ...documentInput.sections[sectionKey],
              comments: [
                {
                  key: expect.any(String),
                  createdBy: nonInputtingUser._id,
                  createdOn: now,
                  deletedBy: null,
                  deletedOn: null,
                  text: 'First comment'
                }
              ]
            }
          }
        });
      });
    });

    describe('when the room is no longer collaborative and the inputting user is posting a comment', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
        result = await sut.createDocumentInputSectionComment({
          documentInputId: documentInput._id,
          sectionKey,
          text: 'First comment',
          user: inputtingUser
        });
      });

      it('should return the updated document input', () => {
        expect(result).toEqual({
          ...documentInput,
          sections: {
            ...documentInput.sections,
            [sectionKey]: {
              ...documentInput.sections[sectionKey],
              comments: [
                {
                  key: expect.any(String),
                  createdBy: inputtingUser._id,
                  createdOn: now,
                  deletedBy: null,
                  deletedOn: null,
                  text: 'First comment'
                }
              ]
            }
          }
        });
      });
    });
  });

  describe('hardDeleteDocumentInput', () => {
    let room;
    let result;
    let document;
    let documentInput;

    beforeEach(async () => {
      room = await createTestRoom(
        container,
        {
          isCollaborative: true,
          ownedBy: roomOwnerUser._id,
          members: [
            { userId: inputtingUser._id, joinedOn: now },
            { userId: nonInputtingUser._id, joinedOn: now }
          ]
        }
      );
      document = await createTestDocument(container, roomOwnerUser, {
        roomId: room._id,
        roomContext: { draft: false, inputSubmittingDisabled: false },
        publicContext: null
      });
      documentInput = await createTestDocumentInput(container, inputtingUser, {
        documentId: document._id,
        documentRevisionId: document.revision,
        sections: {}
      });
    });

    describe('when the document input does not exist', () => {
      it('should throw NotFound', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: uniqueId.create(), user: inputtingUser })).rejects.toThrow(NotFound);
      });
    });

    describe('when the document no longer exists', () => {
      beforeEach(async () => {
        await hardDeletePrivateTestDocument({ container, documentId: document._id, user: roomOwnerUser });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user: inputtingUser })).rejects.toThrow(NotFound);
      });
    });

    describe('when room is collaborative and the user is a room member but not the creator of the documentInput', () => {
      beforeEach(async () => {
        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user: nonInputtingUser });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });

    describe('when the room is no longer collaborative and the user is a room member and the creator of the documentInput', () => {
      beforeEach(async () => {
        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user: inputtingUser });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });

    describe('when the room is no longer collaborative and the user is a room member but not the creator of the documentInput', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user: nonInputtingUser })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room is no longer collaborative and the user is the room owner but not the creator of the documentInput', () => {
      beforeEach(async () => {
        await db.rooms.updateOne({ _id: room._id }, { $set: { isCollaborative: false } });
        await sut.hardDeleteDocumentInput({ documentInputId: documentInput._id, user: roomOwnerUser });
      });

      it('should delete the document input', async () => {
        result = await db.documentInputs.findOne({ _id: documentInput._id });
        expect(result).toEqual(null);
      });
    });
  });
});
