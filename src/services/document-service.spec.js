import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { assert, createSandbox } from 'sinon';
import cloneDeep from '../utils/clone-deep.js';
import LockStore from '../stores/lock-store.js';
import DocumentService from './document-service.js';
import { MEDIA_ASPECT_RATIO } from '../domain/constants.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { EFFECT_TYPE, ORIENTATION } from '../plugins/image/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDocument,
  updateTestDocument,
  createTestRevisions,
  createTestRoom,
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  setupTestUser
} from '../test-helper.js';

const createDefaultSection = () => ({
  key: uniqueId.create(),
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null
});

describe('document-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let lockStore;
  let container;
  let user;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);

    lockStore = container.get(LockStore);

    sut = container.get(DocumentService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createDocument', () => {
    let data;
    let room;
    let createdDocument;
    let createdRevision;
    const roomLock = { _id: uniqueId.create() };
    const documentLock = { _id: uniqueId.create() };

    beforeEach(async () => {
      sandbox.stub(lockStore, 'takeDocumentLock').resolves(documentLock);
      sandbox.stub(lockStore, 'takeRoomLock').resolves(roomLock);
      sandbox.stub(lockStore, 'releaseLock');

      createdRevision = null;
      room = await createTestRoom(container);

      data = {
        title: 'Title',
        slug: 'my-doc',
        language: 'en',
        roomId: room._id,
        roomContext: {
          draft: false
        },
        publicContext: null,
        sections: [
          {
            ...createDefaultSection(),
            type: 'image',
            content: {
              sourceUrl: 'cdn://document-media/image-1.png',
              copyrightNotice: '',
              width: 100,
              effectType: EFFECT_TYPE.hover,
              hoverEffect: {
                sourceUrl: 'cdn://document-media/image-2.png',
                copyrightNotice: ''
              },
              revealEffect: {
                sourceUrl: '',
                copyrightNotice: '',
                startPosition: 0,
                orientation: ORIENTATION.horizontal
              },
              clipEffect: {
                region: {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0
                }
              }
            }
          },
          {
            ...createDefaultSection(),
            type: 'video',
            content: {
              sourceUrl: 'cdn://document-media/video-1.mp4',
              aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
              copyrightNotice: '',
              posterImage: {
                sourceUrl: ''
              },
              playbackRange: [0, 1],
              width: 100,
              initialVolume: 1
            }
          }
        ],
        tags: ['tag-1']
      };

      createdDocument = await sut.createDocument({ data, user });
      createdRevision = await db.documentRevisions.findOne({ _id: createdDocument.revision });
    });

    it('creates an _id', () => {
      expect(createdRevision._id).toMatch(/\w+/);
    });

    it('creates a document id', () => {
      expect(createdRevision.documentId).toMatch(/\w+/);
    });

    it('takes a lock on the document', () => {
      assert.calledWith(lockStore.takeDocumentLock, createdRevision.documentId);
    });

    it('takes a lock on the room', () => {
      assert.calledWith(lockStore.takeRoomLock, room._id);
    });

    it('saves the revision', () => {
      expect(createdRevision).toMatchObject({
        ...data,
        sections: [
          {
            ...data.sections[0],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...data.sections[1],
            revision: expect.stringMatching(/\w+/)
          }
        ],
        createdOn: now,
        createdBy: user._id,
        order: 1,
        restoredFrom: null
      });
    });

    it('generates ids for the sections revisions', () => {
      createdRevision.sections.forEach((section, index) => {
        expect(section.revision).toMatch(/\w+/);
        expect(section.revision).not.toEqual(data.sections[index].revision);
      });
    });

    it('saves all referenced cdn resources with the revision', () => {
      expect(createdRevision.cdnResources).toEqual(['cdn://document-media/image-1.png', 'cdn://document-media/image-2.png', 'cdn://document-media/video-1.mp4']);
    });

    it('creates a document', () => {
      expect(createdDocument).toBeDefined();
    });

    it('updates the room containing the document', async () => {
      const updatedRoom = await db.rooms.findOne({ _id: room._id });
      expect(updatedRoom.documents).toEqual([createdDocument._id]);
    });

    it('saves the revision data onto the document', () => {
      expect(createdDocument).toMatchObject({
        ...data,
        sections: [
          {
            ...data.sections[0],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...data.sections[1],
            revision: expect.stringMatching(/\w+/)
          }
        ],
        revision: createdRevision._id,
        createdOn: now,
        createdBy: user._id,
        updatedOn: now,
        updatedBy: user._id,
        order: 1,
        contributors: [user._id]
      });
    });

    it('saves all referenced cdn resources with the document', () => {
      expect(createdDocument.cdnResources).toEqual(['cdn://document-media/image-1.png', 'cdn://document-media/image-2.png', 'cdn://document-media/video-1.mp4']);
    });

    it('releases the lock on the document', () => {
      assert.calledWith(lockStore.releaseLock, documentLock);
    });

    it('releases the lock on the room', () => {
      assert.calledWith(lockStore.releaseLock, roomLock);
    });
  });

  describe('updateDocument', () => {
    let data;
    let secondTick;
    let secondUser;
    let updatedData;
    let updatedDocument;
    let persistedFirstRevision;
    let persistedSecondRevision;

    beforeEach(async () => {
      secondUser = await setupTestUser(container);

      data = {
        title: 'Title',
        slug: 'my-doc',
        language: 'en',
        sections: [
          {
            ...createDefaultSection(),
            type: 'image',
            content: {
              sourceUrl: 'cdn://document-media/image-1.png',
              copyrightNotice: '',
              width: 100,
              effectType: EFFECT_TYPE.hover,
              hoverEffect: {
                sourceUrl: 'cdn://document-media/image-2.png',
                copyrightNotice: ''
              },
              revealEffect: {
                sourceUrl: '',
                copyrightNotice: '',
                startPosition: 0,
                orientation: ORIENTATION.horizontal
              },
              clipEffect: {
                region: {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0
                }
              }
            }
          },
          {
            ...createDefaultSection(),
            type: 'video',
            content: {
              sourceUrl: 'cdn://document-media/video-1.mp4',
              copyrightNotice: '',
              aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
              posterImage: {
                sourceUrl: ''
              },
              playbackRange: [0, 1],
              width: 100,
              initialVolume: 1
            }
          }
        ],
        tags: ['tag-1'],
        roomId: null,
        roomContext: null,
        publicContext: {
          accreditedEditors: [],
          protected: false,
          archived: false,
          verified: false,
          review: ''
        }
      };

      const initialData = { ...data };

      const initialDocument = await sut.createDocument({ data: initialData, user });
      persistedFirstRevision = await db.documentRevisions.findOne({ _id: initialDocument.revision });

      updatedData = {
        ...initialData,
        title: 'Title 2',
        slug: 'my-doc-2',
        language: 'de',
        sections: [
          ...initialData.sections,
          {
            ...createDefaultSection(),
            type: 'video',
            content: {
              sourceUrl: 'cdn://document-media/video-2.mp4',
              copyrightNotice: '',
              aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
              posterImage: {
                sourceUrl: ''
              },
              playbackRange: [0, 1],
              width: 100,
              initialVolume: 1
            }
          }
        ]
      };

      secondTick = new Date(sandbox.clock.tick(1000));

      updatedDocument = await sut.updateDocument({ documentId: initialDocument._id, data: updatedData, user: secondUser });
      persistedSecondRevision = await db.documentRevisions.findOne({ _id: updatedDocument.revision });
    });

    it('creates an _id', () => {
      expect(persistedSecondRevision._id).toMatch(/\w+/);
    });

    it('sets the same document id', () => {
      expect(persistedSecondRevision.documentId).toBe(persistedFirstRevision.documentId);
    });

    it('saves the second revision', () => {
      const expectedResult = {
        ...updatedData,
        sections: [
          {
            ...updatedData.sections[0],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...updatedData.sections[1],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...updatedData.sections[2],
            revision: expect.stringMatching(/\w+/)
          }
        ],
        createdOn: secondTick,
        createdBy: secondUser._id,
        order: 2,
        restoredFrom: null
      };
      delete expectedResult.appendTo;
      expect(persistedSecondRevision).toMatchObject(expectedResult);
    });

    it('generates ids for the sections revisions', () => {
      persistedSecondRevision.sections.forEach((section, index) => {
        expect(section.revision).toMatch(/\w+/);
        expect(section.revision).not.toEqual(updatedData.sections[index].revision);
      });
    });

    it('saves all referenced cdn resources with the revision', () => {
      expect(persistedSecondRevision.cdnResources).toEqual(['cdn://document-media/image-1.png', 'cdn://document-media/image-2.png', 'cdn://document-media/video-1.mp4', 'cdn://document-media/video-2.mp4']);
    });

    it('saves the second revision data onto the document', () => {
      const expectedResult = {
        ...updatedData,
        sections: [
          {
            ...updatedData.sections[0],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...updatedData.sections[1],
            revision: expect.stringMatching(/\w+/)
          },
          {
            ...updatedData.sections[2],
            revision: expect.stringMatching(/\w+/)
          }
        ],
        revision: persistedSecondRevision._id,
        createdOn: now,
        createdBy: user._id,
        updatedOn: secondTick,
        updatedBy: secondUser._id,
        order: 2,
        contributors: [user._id, secondUser._id]
      };
      delete expectedResult.appendTo;
      expect(updatedDocument).toMatchObject(expectedResult);
    });

    it('saves all referenced cdn resources with the document', () => {
      expect(updatedDocument.cdnResources).toEqual(['cdn://document-media/image-1.png', 'cdn://document-media/image-2.png', 'cdn://document-media/video-1.mp4', 'cdn://document-media/video-2.mp4']);
    });
  });

  describe('hardDeleteDocument', () => {
    let room;
    let documentToDelete;
    const roomLock = { _id: uniqueId.create() };
    const documentLock = { _id: uniqueId.create() };

    beforeEach(async () => {
      sandbox.stub(lockStore, 'takeDocumentLock').resolves(documentLock);
      sandbox.stub(lockStore, 'takeRoomLock').resolves(roomLock);
      sandbox.stub(lockStore, 'releaseLock');

      room = await createTestRoom(container);
      documentToDelete = await createTestDocument(container, user, { roomId: room._id });
      await db.rooms.updateOne({ _id: room._id }, { $set: { documents: ['otherDocumentId', documentToDelete._id] } });

      await sut.hardDeleteDocument(documentToDelete._id);
    });

    it('takes a lock on the document', () => {
      assert.calledWith(lockStore.takeDocumentLock, documentToDelete._id);
    });

    it('takes a lock on the room', () => {
      assert.calledWith(lockStore.takeRoomLock, room._id);
    });

    it('updates the room which container the document', async () => {
      const updatedRoom = await db.rooms.findOne({ _id: room._id });
      expect(updatedRoom.documents).toEqual(['otherDocumentId']);
    });

    it('deletes the document revisions', async () => {
      const documentRevisions = await db.documentRevisions.find({ documentId: documentToDelete._id }).toArray();
      expect(documentRevisions).toEqual([]);
    });

    it('deletes the document', async () => {
      const documentAfterDeletion = await db.documents.findOne({ documentId: documentToDelete._id });
      expect(documentAfterDeletion).toEqual(null);
    });

    it('releases the lock on the document', () => {
      assert.calledWith(lockStore.releaseLock, documentLock);
    });

    it('releases the lock on the room', () => {
      assert.calledWith(lockStore.releaseLock, roomLock);
    });
  });

  describe('restoreDocumentRevision', () => {

    describe('when a document has 3 initial revisions', () => {
      let initialDocumentRevisions;

      beforeEach(async () => {
        const section1 = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Unmodified text',
            width: 100
          }
        };

        const section2 = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Initial text',
            width: 100
          }
        };

        initialDocumentRevisions = await createTestRevisions(container, user, [
          {
            title: 'Revision 1',
            slug: 'rev-1',
            roomId: 'room-1',
            sections: [cloneDeep(section1)]
          },
          {
            title: 'Revision 2',
            slug: 'rev-2',
            roomId: 'room-1',
            sections: [cloneDeep(section1), cloneDeep(section2)]
          },
          {
            title: 'Revision 3',
            slug: 'rev-3',
            roomId: 'room-1',
            sections: [cloneDeep(section1), { ...cloneDeep(section2), content: { text: 'Override text', width: 100 } }]
          }
        ]);
      });

      describe('and no section has been hard-deleted', () => {
        describe('and the second document revision is restored', () => {
          let result;

          beforeEach(async () => {
            result = await sut.restoreDocumentRevision({
              documentId: initialDocumentRevisions[1].documentId,
              revisionId: initialDocumentRevisions[1]._id,
              user
            });
          });

          it('should create another revision', () => {
            expect(result).toHaveLength(4);
          });

          it('should set a new _id', () => {
            expect(result[3]._id).not.toBe(initialDocumentRevisions[1]._id);
          });

          it('should restore the documentId', () => {
            expect(result[3].documentId).toBe(initialDocumentRevisions[1].documentId);
          });

          it('should restore the title', () => {
            expect(result[3].title).toBe(initialDocumentRevisions[1].title);
          });

          it('should restore the slug', () => {
            expect(result[3].slug).toBe(initialDocumentRevisions[1].slug);
          });

          it('should set "restoredFrom" to the restored revision ID', () => {
            expect(result[3].restoredFrom).toBe(initialDocumentRevisions[1]._id);
          });

          it('should preserve section keys', () => {
            expect(result[3].sections[0].key).toBe(initialDocumentRevisions[1].sections[0].key);
            expect(result[3].sections[1].key).toBe(initialDocumentRevisions[1].sections[1].key);
          });

          it('should restore the section content', () => {
            expect(result[3].sections[0].content).toEqual(initialDocumentRevisions[1].sections[0].content);
            expect(result[3].sections[1].content).toEqual(initialDocumentRevisions[1].sections[1].content);
          });

          it('should keep the section revision if the content has not changed in between', () => {
            expect(result[3].sections[0].revision).toBe(initialDocumentRevisions[1].sections[0].revision);
          });

          it('should assign a new section revision if the content has changed in between', () => {
            expect(result[3].sections[1].revision).not.toBe(initialDocumentRevisions[1].sections[1].revision);
          });
        });
      });

      describe('and a changed section has been hard-deleted in the second document revision only', () => {
        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: initialDocumentRevisions[1].documentId,
            sectionKey: initialDocumentRevisions[1].sections[1].key,
            sectionRevision: initialDocumentRevisions[1].sections[1].revision,
            reason: 'This is a test',
            deleteAllRevisions: false,
            user
          });
        });

        describe('and the second document revision is restored', () => {
          let result;

          beforeEach(async () => {
            result = await sut.restoreDocumentRevision({
              documentId: initialDocumentRevisions[1].documentId,
              revisionId: initialDocumentRevisions[1]._id,
              user
            });
          });

          it('should create another revision', () => {
            expect(result).toHaveLength(4);
          });

          it('should set a new _id', () => {
            expect(result[3]._id).not.toBe(initialDocumentRevisions[1]._id);
          });

          it('should restore the documentId', () => {
            expect(result[3].documentId).toBe(initialDocumentRevisions[1].documentId);
          });

          it('should restore the title', () => {
            expect(result[3].title).toBe(initialDocumentRevisions[1].title);
          });

          it('should restore the slug', () => {
            expect(result[3].slug).toBe(initialDocumentRevisions[1].slug);
          });

          it('should set "restoredFrom" to the restored revision ID', () => {
            expect(result[3].restoredFrom).toBe(initialDocumentRevisions[1]._id);
          });

          it('should preserve section keys', () => {
            expect(result[3].sections[0].key).toBe(initialDocumentRevisions[1].sections[0].key);
            expect(result[3].sections[1].key).toBe(initialDocumentRevisions[1].sections[1].key);
          });

          it('should "restore" the deleted section content', () => {
            expect(result[3].sections[0].content).toEqual(initialDocumentRevisions[1].sections[0].content);
            expect(result[3].sections[1].content).toBeNull();
          });

          it('should keep the section revision if the content has not changed in between', () => {
            expect(result[3].sections[0].revision).toBe(initialDocumentRevisions[1].sections[0].revision);
          });

          it('should assign a new section revision for the "re-deleted" section', () => {
            expect(result[3].sections[1].revision).not.toBe(initialDocumentRevisions[1].sections[1].revision);
          });
        });
      });

      describe('and a changed section has been hard-deleted in the third document revision only', () => {
        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: initialDocumentRevisions[2].documentId,
            sectionKey: initialDocumentRevisions[2].sections[1].key,
            sectionRevision: initialDocumentRevisions[2].sections[1].revision,
            reason: 'This is a test',
            deleteAllRevisions: false,
            user
          });
        });

        describe('and the second document revision is restored', () => {
          let result;

          beforeEach(async () => {
            result = await sut.restoreDocumentRevision({
              documentId: initialDocumentRevisions[1].documentId,
              revisionId: initialDocumentRevisions[1]._id,
              user
            });
          });

          it('should create another revision', () => {
            expect(result).toHaveLength(4);
          });

          it('should set a new _id', () => {
            expect(result[3]._id).not.toBe(initialDocumentRevisions[1]._id);
          });

          it('should restore the documentId', () => {
            expect(result[3].documentId).toBe(initialDocumentRevisions[1].documentId);
          });

          it('should restore the title', () => {
            expect(result[3].title).toBe(initialDocumentRevisions[1].title);
          });

          it('should restore the slug', () => {
            expect(result[3].slug).toBe(initialDocumentRevisions[1].slug);
          });

          it('should set "restoredFrom" to the restored revision ID', () => {
            expect(result[3].restoredFrom).toBe(initialDocumentRevisions[1]._id);
          });

          it('should preserve section keys', () => {
            expect(result[3].sections[0].key).toBe(initialDocumentRevisions[1].sections[0].key);
            expect(result[3].sections[1].key).toBe(initialDocumentRevisions[1].sections[1].key);
          });

          it('should restore the section content', () => {
            expect(result[3].sections[0].content).toEqual(initialDocumentRevisions[1].sections[0].content);
            expect(result[3].sections[1].content).toEqual(initialDocumentRevisions[1].sections[1].content);
          });

          it('should keep the section revision if the content has not changed in between', () => {
            expect(result[3].sections[0].revision).toBe(initialDocumentRevisions[1].sections[0].revision);
          });

          it('should assign a new section revision for the "revived" section', () => {
            expect(result[3].sections[1].revision).not.toBe(initialDocumentRevisions[1].sections[1].revision);
          });
        });
      });

    });
  });

  describe('updateArchivedState', () => {
    let initialDocument;
    let updatedDocument;

    describe('to true', () => {
      beforeEach(async () => {
        initialDocument = await createTestDocument(container, user, {
          title: 'Title',
          slug: 'my-doc',
          language: 'en',
          sections: [],
          roomId: null,
          roomContext: null,
          publicContext: {
            protected: true,
            archived: false,
            verified: true,
            review: 'Review'
          }
        });

        updatedDocument = await sut.updateArchivedState({ documentId: initialDocument._id, user, archived: true });
      });

      it('should create a new revision', () => {
        expect(updatedDocument.revision).not.toBe(initialDocument.revision);
      });

      it('should set archived to true', () => {
        expect(updatedDocument.publicContext.archived).toBe(true);
      });

      it('should not change other static revision data', () => {
        const expectedResult = {
          ...initialDocument,
          revision: updatedDocument.revision,
          publicContext: {
            ...updatedDocument.publicContext,
            archived: true
          },
          order: updatedDocument.order
        };
        expect(updatedDocument).toEqual(expectedResult);
      });
    });

    describe('to false', () => {
      beforeEach(async () => {
        initialDocument = await createTestDocument(container, user, {
          title: 'Title',
          slug: 'my-doc',
          language: 'en',
          sections: [],
          roomId: null,
          roomContext: null,
          publicContext: {
            protected: true,
            archived: true,
            verified: true,
            review: 'Review'
          }
        });

        updatedDocument = await sut.updateArchivedState({ documentId: initialDocument._id, user, archived: false });
      });

      it('should create a new revision', () => {
        expect(updatedDocument.revision).not.toBe(initialDocument.revision);
      });

      it('should set archived to false', () => {
        expect(updatedDocument.publicContext.archived).toBe(false);
      });

      it('should not change other static revision data', () => {
        const expectedResult = {
          ...initialDocument,
          revision: updatedDocument.revision,
          publicContext: {
            ...updatedDocument.publicContext,
            archived: false
          },
          order: updatedDocument.order
        };
        expect(updatedDocument).toEqual(expectedResult);
      });
    });
  });

  describe('hardDeleteSection', () => {

    describe('when a section has 3 revisions', () => {
      let documentRevisionsBeforeDeletion;

      beforeEach(async () => {
        const unrelatedSection = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'audio',
          content: {
            sourceUrl: 'cdn://document-media/audio-1.mp3',
            copyrightNotice: 'Unmodified text',
            playbackRange: [0, 1],
            initialVolume: 1
          }
        };

        const sectionToBeDeleted = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'audio',
          content: {
            sourceUrl: 'cdn://document-media/audio-2.mp3',
            copyrightNotice: 'Initial text',
            playbackRange: [0, 1],
            initialVolume: 1
          }
        };

        documentRevisionsBeforeDeletion = await createTestRevisions(container, user, [
          {
            title: 'Revision 1',
            slug: 'rev-1',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, copyrightNotice: 'Unrelated A' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, copyrightNotice: 'Doomed section A' } }
            ]
          },
          {
            title: 'Revision 2',
            slug: 'rev-2',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, copyrightNotice: 'Unrelated B' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, copyrightNotice: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 3',
            slug: 'rev-3',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, copyrightNotice: 'Unrelated C' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, copyrightNotice: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 4',
            slug: 'rev-4',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, copyrightNotice: 'Unrelated D' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, copyrightNotice: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 5',
            slug: 'rev-5',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, copyrightNotice: 'Unrelated E' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, copyrightNotice: 'Doomed section C' } }
            ]
          }
        ]);
      });

      describe('and only the revision in the middle is hard-deleted', () => {
        let documentRevisionsAfterDeletion;

        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: documentRevisionsBeforeDeletion[2].documentId,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: false,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByDocumentId(documentRevisionsBeforeDeletion[0].documentId);
        });

        it('deletes all earlier and later occurrences of that section revision', () => {
          expect(documentRevisionsAfterDeletion[1].sections[1]).toMatchObject({
            deletedOn: expect.any(Date),
            deletedBy: user._id,
            deletedBecause: 'My reason',
            content: null
          });
          expect(documentRevisionsAfterDeletion[2].sections[1]).toMatchObject({
            deletedOn: expect.any(Date),
            deletedBy: user._id,
            deletedBecause: 'My reason',
            content: null
          });
          expect(documentRevisionsAfterDeletion[3].sections[1]).toMatchObject({
            deletedOn: expect.any(Date),
            deletedBy: user._id,
            deletedBecause: 'My reason',
            content: null
          });
        });

        it('does not delete any other revision of that section', () => {
          expect(documentRevisionsAfterDeletion[0].sections[1]).toMatchObject({
            deletedOn: null,
            deletedBy: null,
            deletedBecause: null,
            content: { copyrightNotice: 'Doomed section A' }
          });
          expect(documentRevisionsAfterDeletion[4].sections[1]).toMatchObject({
            deletedOn: null,
            deletedBy: null,
            deletedBecause: null,
            content: { copyrightNotice: 'Doomed section C' }
          });
        });

        it('does not modify unrelated sections', () => {
          [0, 1, 2, 3, 4].forEach(index => {
            expect(documentRevisionsBeforeDeletion[index].sections[0]).toEqual(documentRevisionsAfterDeletion[index].sections[0]);
          });
        });
      });

      describe('and all revisions are hard-deleted', () => {
        let documentRevisionsAfterDeletion;

        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: documentRevisionsBeforeDeletion[2].documentId,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: true,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByDocumentId(documentRevisionsBeforeDeletion[0].documentId);
        });

        it('deletes all occurrences of that section', () => {
          documentRevisionsAfterDeletion.forEach(revision => {
            expect(revision.sections[1]).toMatchObject({
              deletedOn: expect.any(Date),
              deletedBy: user._id,
              deletedBecause: 'My reason',
              content: null
            });
          });
        });

        it('does not modify unrelated sections', () => {
          [0, 1, 2, 3, 4].forEach(index => {
            expect(documentRevisionsBeforeDeletion[index].sections[0]).toEqual(documentRevisionsAfterDeletion[index].sections[0]);
          });
        });
      });

      describe('and the section already contains hard-deleted revisions', () => {
        let documentRevisionsAfterDeletion;

        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: documentRevisionsBeforeDeletion[4].documentId,
            sectionKey: documentRevisionsBeforeDeletion[4].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[4].sections[1].revision,
            reason: 'My old reason',
            deleteAllRevisions: false,
            user
          });

          await sut.hardDeleteSection({
            documentId: documentRevisionsBeforeDeletion[2].documentId,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: true,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByDocumentId(documentRevisionsBeforeDeletion[0].documentId);
        });

        it('does not modify the already hard-deleted revision', () => {
          expect(documentRevisionsAfterDeletion[4].sections[1]).toMatchObject({
            deletedOn: expect.any(Date),
            deletedBy: user._id,
            deletedBecause: 'My old reason',
            content: null
          });
        });
      });

      describe('and the section had cdn resources', () => {
        let documentRevisionsAfterDeletion;

        beforeEach(async () => {
          await sut.hardDeleteSection({
            documentId: documentRevisionsBeforeDeletion[4].documentId,
            sectionKey: documentRevisionsBeforeDeletion[4].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[4].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: false,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByDocumentId(documentRevisionsBeforeDeletion[0].documentId);
        });

        it('removes the cdn resources of the hard-deleted section', () => {
          expect(documentRevisionsBeforeDeletion[4].cdnResources).toMatchObject(['cdn://document-media/audio-1.mp3', 'cdn://document-media/audio-2.mp3']);
          expect(documentRevisionsAfterDeletion[4].cdnResources).toMatchObject(['cdn://document-media/audio-1.mp3']);
        });
      });

    });

  });

  describe('getSearchableDocumentsMetadataByTags', () => {
    let doc1 = null;
    let doc2 = null;
    let doc3 = null;

    beforeEach(async () => {
      doc1 = await createTestDocument(container, user, {
        title: 'Doc 1',
        description: 'Description 1',
        slug: 'doc-1',
        sections: [],
        tags: ['music', 'instructor', 'Dj.D', 'Cretu', '1'],
        language: 'en',
        roomId: null,
        roomContext: null,
        publicContext: {
          accreditedEditors: [],
          protected: false,
          archived: false,
          verified: false,
          review: ''
        }
      });

      doc2 = await createTestDocument(container, user, {
        title: 'Doc 2',
        description: 'Description 2',
        slug: 'doc-2',
        sections: [],
        tags: ['Music', 'Instructor', 'Goga', '2'],
        language: 'en',
        roomId: null,
        roomContext: null,
        publicContext: {
          accreditedEditors: [],
          protected: false,
          archived: false,
          verified: false,
          review: ''
        }
      });

      doc3 = await createTestDocument(container, user, {
        title: 'Doc 3',
        description: 'Description 3',
        slug: 'doc-3',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        language: 'en',
        roomId: null,
        roomContext: null,
        publicContext: {
          accreditedEditors: [],
          protected: false,
          archived: false,
          verified: true,
          review: ''
        }
      });

      await createTestDocument(container, user, {
        title: 'Doc 4',
        description: 'Description 4',
        slug: 'doc-4',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        language: 'en',
        roomId: null,
        roomContext: null,
        publicContext: {
          accreditedEditors: [],
          protected: false,
          archived: true,
          verified: false,
          review: ''
        }
      });

      const room = await createTestRoom(container);
      await createTestDocument(container, user, {
        title: 'Doc 5',
        description: 'Description 5',
        slug: 'doc-5',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        language: 'en',
        roomId: room._id,
        roomContext: { draft: false },
        publicContext: null
      });
    });

    describe('when the query does not match any tag', () => {
      it('should return an empty array', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('I can not find anything in this db');
        expect(results).toHaveLength(0);
      });
    });

    describe('when the query has characters that have to be escaped', () => {
      const testCases = [
        { query: 'Dj.', resultLength: 1 },
        { query: '...', resultLength: 0 },
        { query: 'Dj*', resultLength: 0 }
      ];

      testCases.forEach(test => {
        it(`should return ${test.resultLength} documents for query '${test.query}'`, async () => {
          const results = await sut.getSearchableDocumentsMetadataByTags(test.query);
          expect(results).toHaveLength(test.resultLength);
        });
      });

    });

    describe('when the query consists of tokens with a length less than 3 that require tags to match exactly', () => {
      it('should return only documents that have exactly matching tags', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('1 or 2');
        expect(results).toHaveLength(2);
      });
    });

    describe('when the query consists of multiple tokens so that both partial and exact matching logic has to be applied', () => {
      it('should return documents both matching partially as well as exactly', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('structor 1');
        expect(results).toHaveLength(2);
      });
    });

    describe('when the query matches a single document', () => {
      it('should project the data correctly', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('Wolf   gang \t beat Oven');

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.title).toEqual(doc3.title);
        expect(result.slug).toEqual(doc3.slug);
        expect(result.tags).toEqual(doc3.tags);
        expect(result.language).toEqual(doc3.language);
        expect(result.relevance).toEqual(7);
        expect(result.updatedOn).not.toBeNull();
        expect(result.sections).toBeUndefined();
      });
    });

    describe('when the query matches multiple documents', () => {
      it('does not contain archived documents', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('music');
        expect(results.map(result => result.title)).not.toContain('Doc 4');
      });

      it('contains all documents with the correct relevance', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('music instructor goga');

        expect(results).toHaveLength(3);

        const resultMap = results.reduce((acc, doc) => {
          acc[doc.title] = { ...doc };
          return acc;
        }, {});

        expect(resultMap[doc1.title].relevance).toEqual(2);
        expect(resultMap[doc2.title].relevance).toEqual(3);
        expect(resultMap[doc3.title].relevance).toEqual(4);
      });
    });

    describe('when the query contains the minus search operators', () => {
      it('excludes all documents containing a tag exactly matched by the minus search operator', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('music -goga -cretu');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Doc 3');
      });

      it('does not exclude documents with tags only partially matched by the minus search operator', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('music -goga -cret');

        expect(results).toHaveLength(2);
        expect(results[0].title).toBe('Doc 1');
        expect(results[1].title).toBe('Doc 3');
      });

      it('does not return any result when the query contains only minus operator expressions', async () => {
        const results = await sut.getSearchableDocumentsMetadataByTags('-cretu');

        expect(results).toHaveLength(0);
      });
    });
  });

  describe('regenerateDocument', () => {
    const lock = { _id: 'mylock' };

    let initialDocument;
    let regeneratedDocument;

    beforeEach(async () => {
      sandbox.stub(lockStore, 'takeDocumentLock').resolves(lock);
      sandbox.stub(lockStore, 'releaseLock');

      initialDocument = await createTestDocument(container, user, { slug: 'old-slug' });

      await db.documentRevisions.updateOne({ documentId: initialDocument._id }, { $set: { slug: 'new-slug' } });

      await sut.regenerateDocument(initialDocument._id);

      regeneratedDocument = await db.documents.findOne({ _id: initialDocument._id });
    });

    it('should take a lock on the document', () => {
      assert.calledWith(lockStore.takeDocumentLock, regeneratedDocument._id);
    });

    it('should release the lock on the document', () => {
      assert.calledWith(lockStore.releaseLock, lock);
    });

    it('should save a new document', () => {
      expect(regeneratedDocument.slug).toEqual('new-slug');
    });
  });

  describe('consolidateCdnResources', () => {
    let markdownInfo;
    let documentBeforeConsolidation;
    let documentRevisionsBeforeConsolidation;
    let documentAfterConsolidation;
    let documentRevisionsAfterConsolidation;

    beforeEach(async () => {
      markdownInfo = container.get(MarkdownInfo);

      const sectionRevision1 = {
        ...createDefaultSection(),
        key: uniqueId.create(),
        type: 'markdown',
        content: {
          ...markdownInfo.getDefaultContent()
        }
      };

      const sectionRevision2 = {
        ...sectionRevision1,
        content: {
          ...sectionRevision1.content,
          text: '![](cdn://document-media/some-resource.jpg)'
        }
      };

      const [{ documentId }] = await createTestRevisions(container, user, [{ sections: [sectionRevision1] }, { sections: [sectionRevision2] }]);

      await Promise.all([
        db.documentRevisions.updateMany({ documentId }, { $set: { cdnResources: [] } }),
        db.documents.updateOne({ _id: documentId }, { $set: { cdnResources: [] } })
      ]);

      [documentRevisionsBeforeConsolidation, documentBeforeConsolidation] = await Promise.all([
        db.documentRevisions.find({ documentId }, { sort: [['order', 1]] }).toArray(),
        db.documents.findOne({ _id: documentId })
      ]);

      await sut.consolidateCdnResources(documentId);

      [documentRevisionsAfterConsolidation, documentAfterConsolidation] = await Promise.all([
        db.documentRevisions.find({ documentId }, { sort: [['order', 1]] }).toArray(),
        db.documents.findOne({ _id: documentId })
      ]);
    });

    it('should not have changed document revisions that were correct', () => {
      expect(documentRevisionsAfterConsolidation[0]).toStrictEqual(documentRevisionsBeforeConsolidation[0]);
    });

    it('should have changed document revisions that were not correct', () => {
      expect(documentRevisionsAfterConsolidation[1]).not.toStrictEqual(documentRevisionsBeforeConsolidation[1]);
      expect(documentRevisionsAfterConsolidation[1].cdnResources).toStrictEqual(['cdn://document-media/some-resource.jpg']);
    });

    it('should have regenerated the document', () => {
      expect(documentAfterConsolidation).not.toStrictEqual(documentBeforeConsolidation);
      expect(documentAfterConsolidation.cdnResources).toStrictEqual(['cdn://document-media/some-resource.jpg']);
    });
  });

  describe('getPublicNonArchivedDocumentsByContributingUser', () => {
    let result;
    let otherUser;

    beforeEach(async () => {
      otherUser = await setupTestUser(container);
    });

    describe('when the user did not contribute to any documents', () => {
      beforeEach(async () => {
        result = await sut.getPublicNonArchivedDocumentsByContributingUser(user._id);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when the user contributed on private documents or public documents that are now archived', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container);
        await createTestDocument(container, user, { title: 'Created doc 1', roomId: room._id });

        sandbox.clock.tick(1000);
        await createTestDocument(container, user, { publicContext: { archived: true } });
        result = await sut.getPublicNonArchivedDocumentsByContributingUser(user._id);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when the user is the first and only contributor on 2 document', () => {

      beforeEach(async () => {
        await createTestDocument(container, user, { title: 'Created doc 1' });

        sandbox.clock.tick(1000);
        await createTestDocument(container, otherUser, {});

        sandbox.clock.tick(1000);
        await createTestDocument(container, user, { title: 'Created doc 2' });

        result = await sut.getPublicNonArchivedDocumentsByContributingUser(user._id);
      });

      it('should return the user created documents sorted by last update descending', () => {
        expect(result).toMatchObject([
          { title: 'Created doc 2' },
          { title: 'Created doc 1' }
        ]);
      });
    });

    describe('when the user is the last contributor on someone else\'s documents', () => {
      beforeEach(async () => {
        let doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Updated doc 1' } });

        sandbox.clock.tick(1000);
        await createTestDocument(container, otherUser, {});

        sandbox.clock.tick(1000);
        doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Updated doc 2' } });

        result = await sut.getPublicNonArchivedDocumentsByContributingUser(user._id);
      });

      it('should return the user updated documents sorted by last update descending', () => {
        expect(result).toMatchObject([
          { title: 'Updated doc 2' },
          { title: 'Updated doc 1' }
        ]);
      });
    });

    describe('when the user contributed on multiple documents in different contribution stages (first, mid, last)', () => {
      beforeEach(async () => {
        sandbox.clock.tick(1000);
        let doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Doc 1 - Last updated by contributor' } });

        sandbox.clock.tick(1000);
        doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Doc 2 - Mid updated by contributor' } });
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user: otherUser, data: {} });

        doc = await createTestDocument(container, user, { title: 'Doc 3 - Created by contributor' });
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user: otherUser, data: {} });

        sandbox.clock.tick(1000);
        doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Doc 4 - Last updated by contributor' } });

        sandbox.clock.tick(1000);
        doc = await createTestDocument(container, otherUser, {});
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user, data: { title: 'Doc 5 - Mid updated by contributor' } });
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user: otherUser, data: {} });

        doc = await createTestDocument(container, user, { title: 'Doc 6 - Created by contributor' });
        sandbox.clock.tick(1000);
        await updateTestDocument({ container, documentId: doc._id, user: otherUser, data: {} });

        result = await sut.getPublicNonArchivedDocumentsByContributingUser(user._id);
      });

      it('should return the documents sorted by last, first, mid contribution stages, then by last update date', () => {
        expect(result).toMatchObject([
          { title: 'Doc 4 - Last updated by contributor' },
          { title: 'Doc 1 - Last updated by contributor' },
          { title: 'Doc 6 - Created by contributor' },
          { title: 'Doc 3 - Created by contributor' },
          { title: 'Doc 5 - Mid updated by contributor' },
          { title: 'Doc 2 - Mid updated by contributor' }
        ]);
      });
    });
  });
});
