import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import cloneDeep from '../utils/clone-deep.js';
import DocumentService from './document-service.js';
import { SOURCE_TYPE as IMAGE_SOURCE_TYPE } from '../plugins/image/constants.js';
import { SOURCE_TYPE as VIDEO_SOURCE_TYPE } from '../plugins/video/constants.js';
import { createTestDocument, createTestRevisions, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('document-service', () => {
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

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('createDocumentRevision', () => {
    let key;
    beforeEach(async () => {
      const doc = {
        title: 'Title',
        slug: 'my-doc',
        namespace: 'articles',
        language: 'en',
        sections: [
          {
            key: uniqueId.create(),
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
            key: uniqueId.create(),
            type: 'video',
            content: {
              type: VIDEO_SOURCE_TYPE.internal,
              url: 'media/video-1.mp4'
            }
          }
        ]
      };
      const revision = await sut.createDocumentRevision({ doc, user });
      key = revision.key;
    });
    it('saves all referenced cdn resources with the document revision', async () => {
      const revision = await db.documentRevisions.findOne({ key });
      expect(revision.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4']);
    });
    it('saves all referenced cdn resources with the document', async () => {
      const doc = await db.documents.findOne({ key });
      expect(doc.cdnResources).toEqual(['media/image-1.png', 'media/image-2.png', 'media/video-1.mp4']);
    });
  });

  describe('restoreDocumentRevision', () => {

    describe('when a document has 3 initial revisions', () => {
      let initialDocumentRevisions;

      beforeEach(async () => {
        const section1 = {
          key: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Unmodified text'
          }
        };

        const section2 = {
          key: uniqueId.create(),
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

  describe('hardDeleteSection', () => {

    describe('when a section has 3 revisions', () => {
      let documentRevisionsBeforeDeletion;

      beforeEach(async () => {
        const unrelatedSection = {
          key: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Unmodified text'
          }
        };

        const sectionToBeDeleted = {
          key: uniqueId.create(),
          type: 'markdown',
          content: {
            text: 'Initial text'
          }
        };

        documentRevisionsBeforeDeletion = await createTestRevisions(container, user, [
          {
            title: 'Revision 1',
            slug: 'rev-1',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { text: 'Unrelated A' } },
              { ...cloneDeep(sectionToBeDeleted), content: { text: 'Doomed section A' } }
            ]
          },
          {
            title: 'Revision 2',
            slug: 'rev-2',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { text: 'Unrelated B' } },
              { ...cloneDeep(sectionToBeDeleted), content: { text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 3',
            slug: 'rev-3',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { text: 'Unrelated C' } },
              { ...cloneDeep(sectionToBeDeleted), content: { text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 4',
            slug: 'rev-4',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { text: 'Unrelated D' } },
              { ...cloneDeep(sectionToBeDeleted), content: { text: 'Doomed section B' } }
            ]
          },
          {
            title: 'Revision 5',
            slug: 'rev-5',
            sections: [
              { ...cloneDeep(unrelatedSection), content: { text: 'Unrelated E' } },
              { ...cloneDeep(sectionToBeDeleted), content: { text: 'Doomed section C' } }
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
        slug: 'doc-43',
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
      it('contain all documents with the corect tag match count', async () => {
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

    describe('when I search for archived documents', () => {
      it('contain archived documents', async () => {
        const results = await sut.getDocumentsByTags('Beat oven', { includeArchived: true });

        expect(results).toHaveLength(2);
      });
    });
  });
});
