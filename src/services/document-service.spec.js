import uniqueId from '../utils/unique-id';
import cloneDeep from '../utils/clone-deep';
import DocumentService from './document-service';
import { createTestRevisions, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper';

describe('document-service', () => {
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
    sut = container.get(DocumentService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('restoreDocumentRevision', () => {

    describe('when a document has 3 initial revisions', () => {
      let initialRevisions;

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

        initialRevisions = await createTestRevisions(container, user, [
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
            documentKey: initialRevisions[1].key,
            revisionId: initialRevisions[1]._id,
            user
          });
        });

        it('should create another revision', () => {
          expect(result).toHaveLength(4);
        });

        it('should restore the title', () => {
          expect(result[3].title).toBe(initialRevisions[1].title);
        });

        it('should restore the slug', () => {
          expect(result[3].slug).toBe(initialRevisions[1].slug);
        });

        it('should preserve section keys', () => {
          expect(result[3].sections[0].key).toBe(initialRevisions[1].sections[0].key);
          expect(result[3].sections[1].key).toBe(initialRevisions[1].sections[1].key);
        });

        it('should restore the section content', () => {
          expect(result[3].sections[0].content).toEqual(initialRevisions[1].sections[0].content);
          expect(result[3].sections[1].content).toEqual(initialRevisions[1].sections[1].content);
        });

        it('should keep the section revision if the content has not changed in between', () => {
          expect(result[3].sections[0].revision).toBe(initialRevisions[1].sections[0].revision);
        });

        it('should assign a new section revision if the content has changed in between', () => {
          expect(result[3].sections[1].revision).not.toBe(initialRevisions[1].sections[1].revision);
        });

      });

    });

  });

});
