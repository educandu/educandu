import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import { ROLE } from '../domain/constants.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import DocumentInputService from './document-input-service.js';
import TextFieldInfo from '../plugins/text-field/text-field-info.js';
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
  updateTestDocument,
  createTestSection,
  createTestDocumentInputMediaItem
} from '../test-helper.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

describe('document-input-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let container;
  let roomOwnerUser;
  let inputtingUser;
  let nonInputtingUser;
  let storagePlanStore;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    db = container.get(Database);
    sut = container.get(DocumentInputService);
    storagePlanStore = container.get(StoragePlanStore);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);
    sandbox.stub(cdn, 'uploadObject').resolves();

    const storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 10000 };
    await storagePlanStore.saveStoragePlan(storagePlan);
    roomOwnerUser = await createTestUser(container, { email: 'room_owner_user@test.com', role: ROLE.user, storage: { planId: storagePlan._id, usedBytes: 0, reminders: [] } });
    inputtingUser = await createTestUser(container, { email: 'inputting_user@test.com', role: ROLE.user });
    nonInputtingUser = await createTestUser(container, { email: 'non_inputting_user@test.com', role: ROLE.user });
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
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
          createdBy: roomOwnerUser._id,
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
          createdBy: roomOwnerUser._id,
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
          files: [],
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
          files: [],
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
          files: [],
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
          files: [],
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
          files: [],
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
      const textFieldInfo = container.get(TextFieldInfo);
      sectionKey = 'SAQVpmre63mCHqeCUiEbNR';
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
        publicContext: null,
        sections: [
          createTestSection({
            key: sectionKey,
            type: TextFieldInfo.name,
            content: textFieldInfo.getDefaultContent()
          })
        ]
      });
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
      sandbox.stub(cdn, 'deleteDirectory').resolves();

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
      await createTestDocumentInputMediaItem(container, inputtingUser, {
        documentId: document._id,
        roomId: room._id
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

      it('should delete the document input media items', async () => {
        result = await db.documentInputMediaItems.find({ documentInputId: documentInput._id }).toArray();
        expect(result).toEqual([]);
      });

      it('should delete the CDN resources', () => {
        assert.calledWith(cdn.deleteDirectory, { directoryPath: `document-input-media/${room._id}/${documentInput._id}` });
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

      it('should delete the document input media items', async () => {
        result = await db.documentInputMediaItems.find({ documentInputId: documentInput._id }).toArray();
        expect(result).toEqual([]);
      });

      it('should delete the CDN resources', () => {
        assert.calledWith(cdn.deleteDirectory, { directoryPath: `document-input-media/${room._id}/${documentInput._id}` });
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

      it('should delete the document input media items', async () => {
        result = await db.documentInputMediaItems.find({ documentInputId: documentInput._id }).toArray();
        expect(result).toEqual([]);
      });

      it('should delete the CDN resources', () => {
        assert.calledWith(cdn.deleteDirectory, { directoryPath: `document-input-media/${room._id}/${documentInput._id}` });
      });
    });
  });
});
