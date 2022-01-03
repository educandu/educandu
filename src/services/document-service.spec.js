/* eslint-disable max-lines */
import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import cloneDeep from '../utils/clone-deep.js';
import DocumentService from './document-service.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import { SOURCE_TYPE as IMAGE_SOURCE_TYPE } from '../plugins/image/constants.js';
import { SOURCE_TYPE as VIDEO_SOURCE_TYPE } from '../plugins/video/constants.js';
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
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
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

  describe('createNewDocumentRevision', () => {
    let result;
    let revision;

    beforeEach(() => {
      result = null;
      revision = {
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
              type: VIDEO_SOURCE_TYPE.internal,
              url: 'media/video-1.mp4'
            }
          }
        ],
        tags: ['tag-1']
      };
    });

    describe('when it is the first revision', () => {
      let createdDocument;

      beforeEach(async () => {
        result = await sut.createNewDocumentRevision({ doc: revision, user });
        createdDocument = await db.documents.findOne({ key: result.key });
      });

      it('creates an _id', () => {
        expect(result._id).toMatch(/\w+/);
      });

      it('creates a document key', () => {
        expect(result.key).toMatch(/\w+/);
      });

      it('saves the revision', () => {
        expect(result).toMatchObject({
          ...revision,
          sections: [
            {
              ...revision.sections[0],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...revision.sections[1],
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
        result.sections.forEach((section, index) => {
          expect(section.revision).toMatch(/\w+/);
          expect(section.revision).not.toEqual(revision.sections[index].revision);
        });
      });

      it('saves all referenced cdn resources with the revision', () => {
        expect(result.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4']);
      });

      it('creates a document', () => {
        expect(createdDocument).toBeDefined();
      });

      it('saves the revision data onto the document', () => {
        expect(createdDocument).toMatchObject({
          ...revision,
          sections: [
            {
              ...revision.sections[0],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...revision.sections[1],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          revision: result._id,
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

    describe('when it is the second revision', () => {
      let secondTick;
      let secondUser;
      let secondRevision;
      let updatedDocument;
      let persistedFirstRevision;

      beforeEach(async () => {
        const firstRevision = { ...revision };
        persistedFirstRevision = await sut.createNewDocumentRevision({ doc: firstRevision, user });

        secondUser = await setupTestUser(container);

        secondRevision = {
          ...firstRevision,
          title: 'Title 2',
          slug: 'my-doc-2',
          language: 'de',
          sections: [
            ...firstRevision.sections,
            {
              ...createDefaultSection(),
              type: 'video',
              content: {
                type: VIDEO_SOURCE_TYPE.internal,
                url: 'media/video-2.mp4'
              }
            }
          ],
          appendTo: {
            key: persistedFirstRevision.key,
            ancestorId: persistedFirstRevision._id
          }
        };

        secondTick = new Date(sandbox.clock.tick(1000));

        result = await sut.createNewDocumentRevision({ doc: secondRevision, user: secondUser });
        updatedDocument = await db.documents.findOne({ key: result.key });
      });

      it('creates an _id', () => {
        expect(result._id).toMatch(/\w+/);
      });

      it('sets the same document key', () => {
        expect(result.key).toBe(persistedFirstRevision.key);
      });

      it('saves the second revision', () => {
        const expectedResult = {
          ...secondRevision,
          sections: [
            {
              ...secondRevision.sections[0],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...secondRevision.sections[1],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...secondRevision.sections[2],
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
        expect(result).toMatchObject(expectedResult);
      });

      it('generates ids for the sections revisions', () => {
        result.sections.forEach((section, index) => {
          expect(section.revision).toMatch(/\w+/);
          expect(section.revision).not.toEqual(secondRevision.sections[index].revision);
        });
      });

      it('saves all referenced cdn resources with the revision', () => {
        expect(result.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4', 'media/video-2.mp4']);
      });

      it('saves the second revision data onto the document', () => {
        const expectedResult = {
          ...secondRevision,
          sections: [
            {
              ...secondRevision.sections[0],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...secondRevision.sections[1],
              revision: expect.stringMatching(/\w+/)
            },
            {
              ...secondRevision.sections[2],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          revision: result._id,
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
  });

  describe('copyDocumentRevisions', () => {
    let revisions;
    const documentKey = uniqueId.create();
    const userId1 = uniqueId.create();

    beforeEach(() => {
      revisions = [
        {
          _id: uniqueId.create(),
          key: documentKey,
          title: 'Title 1',
          slug: 'my-doc-1',
          language: 'en',
          createdBy: userId1,
          sections: [
            {
              ...createDefaultSection(),
              revision: uniqueId.create(),
              type: 'video',
              content: {
                type: VIDEO_SOURCE_TYPE.internal,
                url: 'media/video-1.mp4'
              }
            }
          ],
          tags: ['tag-1']
        },
        {
          _id: uniqueId.create(),
          key: documentKey,
          title: 'Title 2',
          slug: 'my-doc-2',
          language: 'en',
          createdBy: userId1,
          sections: [
            {
              ...createDefaultSection(),
              revision: uniqueId.create(),
              type: 'video',
              content: {
                type: VIDEO_SOURCE_TYPE.internal,
                url: 'media/video-1.mp4'
              }
            }
          ],
          tags: ['tag-2']
        }
      ];
    });

    describe('when it is the first revision', () => {
      let createdDocument;

      beforeEach(async () => {
        await sut.copyDocumentRevisions({ revisions, ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        createdDocument = await db.documents.findOne({ key: documentKey });
      });

      it('creates the revisions', async () => {
        const createdRevisions = await db.documentRevisions.find({ key: documentKey }).sort({ order: 1 }).toArray();

        expect(createdRevisions).toEqual([
          {
            ...revisions[0],
            sections: [
              {
                ...revisions[0].sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            order: 1,
            createdOn: now,
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
            createdOn: now,
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          }
        ]);
      });

      it('creates a document with the given key', () => {
        expect(createdDocument.key).toBe(documentKey);
      });

      it('saves the last revision data onto the document', () => {
        expect(createdDocument).toMatchObject({
          ...revisions[1],
          _id: documentKey,
          revision: revisions[1]._id,
          createdOn: now,
          createdBy: revisions[1].createdBy,
          updatedOn: now,
          updatedBy: revisions[1].createdBy,
          order: 2,
          archived: false,
          contributors: [revisions[1].createdBy],
          cdnResources: ['media/video-1.mp4']
        });
      });
    });

    describe('when it is the second revision', () => {
      let secondTick;
      let updatedDocument;

      beforeEach(async () => {
        await sut.copyDocumentRevisions({ revisions: [revisions[0]], ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });

        secondTick = new Date(sandbox.clock.tick(1000));

        await sut.copyDocumentRevisions({ revisions: [revisions[1]], ancestorId: revisions[0]._id, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        updatedDocument = await db.documents.findOne({ key: documentKey });
      });

      it('creates the revisions', async () => {
        const createdRevisions = await db.documentRevisions.find({ key: documentKey }).toArray();
        expect(createdRevisions).toEqual([
          {
            ...revisions[0],
            sections: [
              {
                ...revisions[0].sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            order: 1,
            createdOn: now,
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
            createdOn: secondTick,
            origin: 'external/origin.url',
            originUrl: 'https://origin.url',
            restoredFrom: '',
            archived: false,
            cdnResources: ['media/video-1.mp4']
          }
        ]);
      });

      it('creates a document with the given key', () => {
        expect(updatedDocument.key).toBe(documentKey);
      });

      it('saves the last revision data onto the document', () => {
        expect(updatedDocument).toMatchObject({
          ...revisions[1],
          sections: [
            {
              ...revisions[1].sections[0],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          _id: documentKey,
          revision: revisions[1]._id,
          createdOn: now,
          createdBy: revisions[1].createdBy,
          updatedOn: secondTick,
          updatedBy: revisions[1].createdBy,
          order: 2,
          archived: false,
          contributors: [revisions[1].createdBy],
          cdnResources: ['media/video-1.mp4']
        });
      });
    });

    describe('when the ancestorId does not match the last revision', () => {
      let result;
      const expectedAncestorId = uniqueId.create();

      beforeEach(async () => {
        await sut.copyDocumentRevisions({ revisions: [revisions[0]], ancestorId: null, origin: 'external/origin.url', originUrl: 'https://origin.url' });

        try {
          await sut.copyDocumentRevisions({ revisions: [revisions[1]], ancestorId: expectedAncestorId, origin: 'external/origin.url', originUrl: 'https://origin.url' });
        } catch (error) {
          result = error;
        }
      });

      it('throws', () => {
        expect(result?.message).toBe(`Import of document '${documentKey}' expected to find revision '${expectedAncestorId}' as the latest revision but found revision '${revisions[0]._id}'`);
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
            id: 'id-rev-1',
            key: 'key',
            title: 'Revision 1',
            slug: 'rev-1',
            sections: [cloneDeep(section1)]
          },
          {
            id: 'id-rev-2',
            key: 'key',
            title: 'Revision 2',
            slug: 'rev-2',
            sections: [cloneDeep(section1), cloneDeep(section2)]
          },
          {
            id: 'id-rev-3',
            key: 'key',
            title: 'Revision 3',
            slug: 'rev-3',
            sections: [cloneDeep(section1), { ...cloneDeep(section2), content: { text: 'Override text' } }]
          }
        ]);
      });

      describe('and the second revision is restored', () => {
        let result;

        beforeEach(async () => {
          result = await sut.restoreDocumentRevision({
            documentKey: initialDocumentRevisions[1].key,
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

        it('should restore the key', () => {
          expect(result[3].key).toBe(initialDocumentRevisions[1].key);
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

  });

  describe('setArchivedState', () => {
    let result;
    let revision;

    describe('to true', () => {
      beforeEach(async () => {
        const revisionToCreate = {
          title: 'Title',
          slug: 'my-doc',
          language: 'en',
          sections: [],
          archived: false
        };
        revision = await sut.createNewDocumentRevision({ doc: revisionToCreate, user });

        result = await sut.setArchivedState({ documentKey: revision.key, user, archived: true });
      });

      it('should create a new revision', () => {
        expect(result._id).not.toBe(revision._id);
      });

      it('should set archived to true', () => {
        expect(result.archived).toBe(true);
      });

      it('should not change other static revision data', () => {
        const expectedResult = { ...revision, _id: result._id, archived: result.archived, order: result.order };
        expect(result).toEqual(expectedResult);
      });
    });

    describe('to false', () => {
      beforeEach(async () => {
        const revisionToCreate = {
          title: 'Title',
          slug: 'my-doc',
          language: 'en',
          sections: [],
          archived: true
        };
        revision = await sut.createNewDocumentRevision({ doc: revisionToCreate, user });

        result = await sut.setArchivedState({ documentKey: revision.key, user, archived: false });
      });

      it('should create a new revision', () => {
        expect(result._id).not.toBe(revision._id);
      });

      it('should set archived to false', () => {
        expect(result.archived).toBe(false);
      });

      it('should not change other static revision data', () => {
        const expectedResult = { ...revision, _id: result._id, archived: result.archived, order: result.order };
        expect(result).toEqual(expectedResult);
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
            maxWidth: 100,
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
            maxWidth: 100,
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
            documentKey: documentRevisionsBeforeDeletion[2].key,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: false,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByKey(documentRevisionsBeforeDeletion[0].key);
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
            documentKey: documentRevisionsBeforeDeletion[2].key,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: true,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByKey(documentRevisionsBeforeDeletion[0].key);
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
            documentKey: documentRevisionsBeforeDeletion[4].key,
            sectionKey: documentRevisionsBeforeDeletion[4].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[4].sections[1].revision,
            reason: 'My old reason',
            deleteAllRevisions: false,
            user
          });

          await sut.hardDeleteSection({
            documentKey: documentRevisionsBeforeDeletion[2].key,
            sectionKey: documentRevisionsBeforeDeletion[2].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[2].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: true,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByKey(documentRevisionsBeforeDeletion[0].key);
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
            documentKey: documentRevisionsBeforeDeletion[4].key,
            sectionKey: documentRevisionsBeforeDeletion[4].sections[1].key,
            sectionRevision: documentRevisionsBeforeDeletion[4].sections[1].revision,
            reason: 'My reason',
            deleteAllRevisions: false,
            user
          });

          documentRevisionsAfterDeletion = await sut.getAllDocumentRevisionsByKey(documentRevisionsBeforeDeletion[0].key);
        });

        it('removes the cdn resources of the hard-deleted section', () => {
          expect(documentRevisionsBeforeDeletion[4].cdnResources).toMatchObject(['media/image-1.png', 'media/image-2.png']);
          expect(documentRevisionsAfterDeletion[4].cdnResources).toMatchObject(['media/image-1.png']);
        });
      });

    });

  });

  describe('whenSearchingByTags', () => {
    let doc1 = null;
    let doc2 = null;
    let doc3 = null;

    beforeEach(async () => {
      doc1 = await createTestDocument(container, user, {
        title: 'Doc 1',
        slug: 'doc-1',
        sections: [],
        tags: ['music', 'instructor', 'Dj.D', 'Cretu'],
        archived: false,
        language: 'en'
      });

      doc2 = await createTestDocument(container, user, {
        title: 'Doc 2',
        slug: 'doc-2',
        sections: [],
        tags: ['Music', 'Instructor', 'Goga'],
        archived: false,
        language: 'en'
      });

      doc3 = await createTestDocument(container, user, {
        title: 'Doc 3',
        slug: 'doc-3',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        archived: false,
        language: 'en'
      });

      await createTestDocument(container, user, {
        title: 'Doc 4',
        slug: 'doc-4',
        sections: [],
        tags: ['Wolf', 'gang', 'from', 'Beat', 'oven', 'music'],
        archived: true,
        language: 'en'
      });
    });

    describe('when I search for something that should not match', () => {
      it('should return an empty array', async () => {
        const results = await sut.getDocumentsByTags('I can not find anything in this db');
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
          const results = await sut.getDocumentsByTags(test.query);
          expect(results).toHaveLength(test.resultLength);
        });
      });

    });

    describe('when I search for a string that leads no valid tags', () => {
      it('should return an empty array', async () => {
        const results = await sut.getDocumentsByTags('to o sh or t');
        expect(results).toHaveLength(0);
      });
    });

    describe('when I search with a query that returns a single document', () => {
      it('should project the data correctly', async () => {
        const results = await sut.getDocumentsByTags('Wolf   gang \t beat Oven');

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
        const results = await sut.getDocumentsByTags('music');
        expect(results.map(result => result.title)).not.toContain('Doc 4');
      });

      it('contains all documents with the correct tag match count', async () => {
        const results = await sut.getDocumentsByTags('music instructor goga');

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
        const results = await sut.getDocumentsByTags('music -goga -cretu');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Doc 3');
      });

      it('does not exclude documents with tags only partially matched by the minus search operator', async () => {
        const results = await sut.getDocumentsByTags('music -goga -cret');

        expect(results).toHaveLength(2);
        expect(results[0].title).toBe('Doc 3');
        expect(results[1].title).toBe('Doc 1');
      });

      it('does not return any result when the query contains only minus operator expressions', async () => {
        const results = await sut.getDocumentsByTags('-cretu');

        expect(results).toHaveLength(0);
      });
    });
  });
});
