/* eslint-disable max-lines */
import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import cloneDeep from '../utils/clone-deep.js';
import LockStore from '../stores/lock-store.js';
import DocumentService from './document-service.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { DOCUMENT_ORIGIN, IMAGE_SOURCE_TYPE, MEDIA_SOURCE_TYPE } from '../domain/constants.js';
import { createTestDocument, createTestRevisions, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

const createDefaultSection = () => ({
  key: uniqueId.create(),
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null
});

describe('document-service', () => {
  const sandbox = sinon.createSandbox();
  const now = new Date();

  let container;
  let user;

  let lockStore;

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
    let createdDocument;
    let createdRevision;

    beforeEach(() => {
      createdRevision = null;
    });

    beforeEach(async () => {
      data = {
        title: 'Title',
        slug: 'my-doc',
        language: 'en',
        sections: [
          {
            ...createDefaultSection(),
            type: 'image',
            content: {
              sourceType: IMAGE_SOURCE_TYPE.internal,
              sourceUrl: 'media/image-1.png',
              effect: {
                sourceType: IMAGE_SOURCE_TYPE.internal,
                sourceUrl: 'media/image-2.png'
              }
            }
          },
          {
            ...createDefaultSection(),
            type: 'video',
            content: {
              sourceType: MEDIA_SOURCE_TYPE.internal,
              sourceUrl: 'media/video-1.mp4',
              posterImage: {}
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
        restoredFrom: '',
        archived: false,
        origin: DOCUMENT_ORIGIN.internal
      });
    });

    it('generates ids for the sections revisions', () => {
      createdRevision.sections.forEach((section, index) => {
        expect(section.revision).toMatch(/\w+/);
        expect(section.revision).not.toEqual(data.sections[index].revision);
      });
    });

    it('saves all referenced cdn resources with the revision', () => {
      expect(createdRevision.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4']);
    });

    it('creates a document', () => {
      expect(createdDocument).toBeDefined();
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
        archived: false,
        origin: DOCUMENT_ORIGIN.internal,
        contributors: [user._id]
      });
    });

    it('saves all referenced cdn resources with the document', () => {
      expect(createdDocument.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4']);
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
              sourceType: IMAGE_SOURCE_TYPE.internal,
              sourceUrl: 'media/image-1.png',
              effect: {
                sourceType: IMAGE_SOURCE_TYPE.internal,
                sourceUrl: 'media/image-2.png'
              }
            }
          },
          {
            ...createDefaultSection(),
            type: 'video',
            content: {
              sourceType: MEDIA_SOURCE_TYPE.internal,
              sourceUrl: 'media/video-1.mp4',
              posterImage: {}
            }
          }
        ],
        tags: ['tag-1']
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
              sourceType: MEDIA_SOURCE_TYPE.internal,
              sourceUrl: 'media/video-2.mp4',
              posterImage: {}
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
        restoredFrom: '',
        archived: false,
        origin: DOCUMENT_ORIGIN.internal
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
      expect(persistedSecondRevision.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4', 'media/video-2.mp4']);
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
        archived: false,
        origin: DOCUMENT_ORIGIN.internal,
        contributors: [user._id, secondUser._id]
      };
      delete expectedResult.appendTo;
      expect(updatedDocument).toMatchObject(expectedResult);
    });

    it('saves all referenced cdn resources with the document', () => {
      expect(updatedDocument.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4', 'media/video-2.mp4']);
    });
  });

  describe('importDocumentRevisions', () => {
    let revisions;
    const documentId = uniqueId.create();
    const userId1 = uniqueId.create();

    beforeEach(() => {
      revisions = [
        {
          _id: uniqueId.create(),
          documentId,
          title: 'Title 1',
          description: 'Description 1',
          slug: 'my-doc-1',
          language: 'en',
          createdOn: new Date().toISOString(),
          createdBy: userId1,
          sections: [
            {
              ...createDefaultSection(),
              revision: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-1.mp4',
                posterImage: {}
              },
              deletedOn: new Date().toISOString()
            }
          ],
          tags: ['tag-1'],
          review: 'review'
        },
        {
          _id: uniqueId.create(),
          documentId,
          title: 'Title 2',
          description: 'Description 2',
          slug: 'my-doc-2',
          language: 'en',
          createdOn: new Date().toISOString(),
          createdBy: userId1,
          sections: [
            {
              ...createDefaultSection(),
              revision: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-1.mp4',
                posterImage: {}
              }
            }
          ],
          tags: ['tag-2'],
          review: 'review'
        }
      ];
    });

    describe('when it is the first revision', () => {
      let createdDocument;

      beforeEach(async () => {
        await sut.importDocumentRevisions({ documentId, revisions, ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        createdDocument = await db.documents.findOne({ _id: documentId });
      });

      it('creates the revisions', async () => {
        const createdRevisions = await db.documentRevisions.find({ documentId }).sort({ order: 1 }).toArray();

        expect(createdRevisions).toEqual([
          {
            ...revisions[0],
            sections: [
              {
                ...revisions[0].sections[0],
                revision: expect.stringMatching(/\w+/),
                deletedOn: new Date(revisions[0].sections[0].deletedOn)
              }
            ],
            order: 1,
            createdOn: new Date(revisions[0].createdOn),
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          },
          {
            ...revisions[1],
            sections: [
              {
                ...revisions[1].sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            order: 2,
            createdOn: new Date(revisions[1].createdOn),
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          }
        ]);
      });

      it('creates a document with the given id', () => {
        expect(createdDocument._id).toBe(documentId);
      });

      it('saves the last revision data onto the document', () => {
        const expectedDocument = {
          ...revisions[1],
          _id: documentId,
          revision: revisions[1]._id,
          createdOn: new Date(revisions[1].createdOn),
          createdBy: revisions[1].createdBy,
          updatedOn: now,
          updatedBy: revisions[1].createdBy,
          order: 2,
          archived: false,
          origin: 'external/origin.url',
          originUrl: 'https://origin.url',
          contributors: [revisions[1].createdBy],
          cdnResources: ['media/video-1.mp4']
        };
        delete expectedDocument.documentId;

        expect(createdDocument).toMatchObject(expectedDocument);
      });
    });

    describe('when it is the second revision', () => {
      let updatedDocument;

      beforeEach(async () => {
        await sut.importDocumentRevisions({ documentId, revisions: [revisions[0]], ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        await sut.importDocumentRevisions({ documentId, revisions: [revisions[1]], ancestorId: revisions[0]._id, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        updatedDocument = await db.documents.findOne({ _id: documentId });
      });

      it('creates the revisions', async () => {
        const createdRevisions = await db.documentRevisions.find({ documentId }).toArray();
        expect(createdRevisions).toEqual([
          {
            ...revisions[0],
            sections: [
              {
                ...revisions[0].sections[0],
                revision: expect.stringMatching(/\w+/),
                deletedOn: new Date(revisions[0].sections[0].deletedOn)
              }
            ],
            order: 1,
            createdOn: new Date(revisions[0].createdOn),
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          },
          {
            ...revisions[1],
            sections: [
              {
                ...revisions[1].sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            order: 2,
            createdOn: new Date(revisions[1].createdOn),
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          }
        ]);
      });

      it('creates a document with the given id', () => {
        expect(updatedDocument._id).toBe(documentId);
      });

      it('saves the last revision data onto the document', () => {
        const expectedDocument = {
          ...revisions[1],
          sections: [
            {
              ...revisions[1].sections[0],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          _id: documentId,
          revision: revisions[1]._id,
          createdOn: new Date(revisions[1].createdOn),
          createdBy: revisions[1].createdBy,
          updatedOn: new Date(revisions[1].createdOn),
          updatedBy: revisions[1].createdBy,
          order: 2,
          archived: false,
          contributors: [revisions[1].createdBy],
          cdnResources: ['media/video-1.mp4']
        };
        delete expectedDocument.documentId;

        expect(updatedDocument).toMatchObject(expectedDocument);
      });
    });

    describe('when the ancestorId does not match the last revision', () => {
      let result;
      const expectedAncestorId = uniqueId.create();

      beforeEach(async () => {
        await sut.importDocumentRevisions({ documentId, revisions: [revisions[0]], ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });

        try {
          await sut.importDocumentRevisions({ documentId, revisions: [revisions[1]], ancestorId: expectedAncestorId, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        } catch (error) {
          result = error;
        }
      });

      it('throws', () => {
        expect(result?.message).toBe(`Import of document '${documentId}' expected to find revision '${expectedAncestorId}' as the latest revision but found revision '${revisions[0]._id}'`);
      });
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
            text: 'Unmodified text'
          }
        };

        const section2 = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Initial text'
          }
        };

        initialDocumentRevisions = await createTestRevisions(container, user, [
          {
            title: 'Revision 1',
            slug: 'rev-1',
            sections: [cloneDeep(section1)]
          },
          {
            title: 'Revision 2',
            slug: 'rev-2',
            sections: [cloneDeep(section1), cloneDeep(section2)]
          },
          {
            title: 'Revision 3',
            slug: 'rev-3',
            sections: [cloneDeep(section1), { ...cloneDeep(section2), content: { text: 'Override text' } }]
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
          archived: false
        });

        updatedDocument = await sut.updateArchivedState({ documentId: initialDocument._id, user, archived: true });
      });

      it('should create a new revision', () => {
        expect(updatedDocument.revision).not.toBe(initialDocument.revision);
      });

      it('should set archived to true', () => {
        expect(updatedDocument.archived).toBe(true);
      });

      it('should not change other static revision data', () => {
        const expectedResult = { ...initialDocument, revision: updatedDocument.revision, archived: updatedDocument.archived, order: updatedDocument.order };
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
          archived: true
        });

        updatedDocument = await sut.updateArchivedState({ documentId: initialDocument._id, user, archived: false });
      });

      it('should create a new revision', () => {
        expect(updatedDocument.revision).not.toBe(initialDocument.revision);
      });

      it('should set archived to false', () => {
        expect(updatedDocument.archived).toBe(false);
      });

      it('should not change other static revision data', () => {
        const expectedResult = { ...initialDocument, revision: updatedDocument.revision, archived: updatedDocument.archived, order: updatedDocument.order };
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
          type: 'image',
          content: {
            sourceType: 'internal',
            sourceUrl: 'media/image-1.png',
            width: 100,
            text: 'Unmodified text',
            effect: null
          }
        };

        const sectionToBeDeleted = {
          ...createDefaultSection(),
          revision: uniqueId.create(),
          type: 'image',
          content: {
            sourceType: 'internal',
            sourceUrl: 'media/image-2.png',
            width: 100,
            text: 'Initial text',
            effect: null
          }
        };

        documentRevisionsBeforeDeletion = await createTestRevisions(container, user, [
          {
            title: 'Revision 1',
            slug: 'rev-1',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, text: 'Unrelated A' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, text: 'Doomed section A' } }
            ]
          },
          {
            title: 'Revision 2',
            slug: 'rev-2',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, text: 'Unrelated B' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 3',
            slug: 'rev-3',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, text: 'Unrelated C' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 4',
            slug: 'rev-4',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, text: 'Unrelated D' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 5',
            slug: 'rev-5',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { ...unrelatedSection.content, text: 'Unrelated E' } },
              { ...cloneDeep(sectionToBeDeleted), content: { ...sectionToBeDeleted.content, text: 'Doomed section C' } }
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
            content: { text: 'Doomed section A' }
          });
          expect(documentRevisionsAfterDeletion[4].sections[1]).toMatchObject({
            deletedOn: null,
            deletedBy: null,
            deletedBecause: null,
            content: { text: 'Doomed section C' }
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
          expect(documentRevisionsBeforeDeletion[4].cdnResources).toMatchObject(['media/image-1.png', 'media/image-2.png']);
          expect(documentRevisionsAfterDeletion[4].cdnResources).toMatchObject(['media/image-1.png']);
        });
      });

    });

  });

  describe('getDocumentsMetadataByTags', () => {
    let doc1 = null;
    let doc2 = null;
    let doc3 = null;

    beforeEach(async () => {
      doc1 = await createTestDocument(container, user, {
        title: 'Doc 1',
        description: 'Description 1',
        slug: 'doc-1',
        sections: [],
        tags: ['music', 'instructor', 'Dj.D', 'Cretu'],
        archived: false,
        language: 'en'
      });

      doc2 = await createTestDocument(container, user, {
        title: 'Doc 2',
        description: 'Description 2',
        slug: 'doc-2',
        sections: [],
        tags: ['Music', 'Instructor', 'Goga'],
        archived: false,
        language: 'en'
      });

      doc3 = await createTestDocument(container, user, {
        title: 'Doc 3',
        description: 'Description 3',
        slug: 'doc-3',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        archived: false,
        language: 'en'
      });

      await createTestDocument(container, user, {
        title: 'Doc 4',
        description: 'Description 4',
        slug: 'doc-4',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        archived: true,
        language: 'en'
      });
    });

    describe('when I search for something that should not match', () => {
      it('should return an empty array', async () => {
        const results = await sut.getDocumentsMetadataByTags('I can not find anything in this db');
        expect(results).toHaveLength(0);
      });
    });

    describe('when I search for something that should be escaped', () => {
      const testCases = [
        { query: 'Dj.', resultLength: 1 },
        { query: '...', resultLength: 0 },
        { query: 'Dj*', resultLength: 0 }
      ];

      testCases.forEach(test => {
        it(`should return ${test.resultLength} documents for ${test.query} `, async () => {
          const results = await sut.getDocumentsMetadataByTags(test.query);
          expect(results).toHaveLength(test.resultLength);
        });
      });

    });

    describe('when I search for a string that leads no valid tags', () => {
      it('should return an empty array', async () => {
        const results = await sut.getDocumentsMetadataByTags('to o sh or t');
        expect(results).toHaveLength(0);
      });
    });

    describe('when I search with a query that returns a single document', () => {
      it('should project the data correctly', async () => {
        const results = await sut.getDocumentsMetadataByTags('Wolf   gang \t beat Oven');

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.title).toEqual(doc3.title);
        expect(result.slug).toEqual(doc3.slug);
        expect(result.tags).toEqual(doc3.tags);
        expect(result.language).toEqual(doc3.language);
        expect(result.tagMatchCount).toEqual(4);
        expect(result.updatedOn).not.toBeNull();
        expect(result.sections).toBeUndefined();
      });
    });

    describe('when I search with a query that returns multiple documents', () => {
      it('does not contain archived documents', async () => {
        const results = await sut.getDocumentsMetadataByTags('music');
        expect(results.map(result => result.title)).not.toContain('Doc 4');
      });

      it('contains all documents with the correct tag match count', async () => {
        const results = await sut.getDocumentsMetadataByTags('music instructor goga');

        expect(results).toHaveLength(3);

        const resultMap = results.reduce((acc, doc) => {
          acc[doc.title] = { ...doc };
          return acc;
        }, {});

        expect(resultMap[doc1.title].tagMatchCount).toEqual(2);
        expect(resultMap[doc2.title].tagMatchCount).toEqual(3);
        expect(resultMap[doc3.title].tagMatchCount).toEqual(1);
      });
    });

    describe('when I search using the minus search operators', () => {
      it('excludes all documents containing a tag entirely matched by the minus search operator', async () => {
        const results = await sut.getDocumentsMetadataByTags('music -goga -cretu');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Doc 3');
      });

      it('does not exclude documents with tags only partially matched by the minus search operator', async () => {
        const results = await sut.getDocumentsMetadataByTags('music -goga -cret');

        expect(results).toHaveLength(2);
        expect(results[0].title).toBe('Doc 3');
        expect(results[1].title).toBe('Doc 1');
      });

      it('does not return any result when the query contains only minus operator expressions', async () => {
        const results = await sut.getDocumentsMetadataByTags('-cretu');

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
      sinon.assert.calledWith(lockStore.takeDocumentLock, regeneratedDocument._id);
    });

    it('should release the lock on the document', () => {
      sinon.assert.calledWith(lockStore.releaseLock, lock);
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
          ...markdownInfo.getDefaultContent(),
          renderMedia: true
        }
      };

      const sectionRevision2 = {
        ...sectionRevision1,
        content: {
          ...sectionRevision1.content,
          text: '![](cdn://media/some-resource.jpg)'
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
      expect(documentRevisionsAfterConsolidation[1].cdnResources).toStrictEqual(['media/some-resource.jpg']);
    });

    it('should have regenerated the document', () => {
      expect(documentAfterConsolidation).not.toStrictEqual(documentBeforeConsolidation);
      expect(documentAfterConsolidation.cdnResources).toStrictEqual(['media/some-resource.jpg']);
    });
  });

});
