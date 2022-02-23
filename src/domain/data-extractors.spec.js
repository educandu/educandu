import { extractUserIdsFromDocsOrRevisions } from './data-extractors.js';

describe('data-extractors', () => {

  describe('extractUserIdsFromDocsOrRevisions', () => {
    let result;

    beforeEach(() => {
      const document = {
        createdBy: 'user1',
        updatedBy: 'user3',
        contributors: ['user1', 'user2', 'user3'],
        sections: [
          { deletedBy: 'user2' },
          { deletedBy: 'user4' }
        ]
      };
      const documentRevision = {
        createdBy: 'user3',
        sections: [
          { deletedBy: 'user2' },
          { deletedBy: 'user4' },
          { deletedBy: 'user3' }
        ]
      };

      result = extractUserIdsFromDocsOrRevisions([document, documentRevision]);
    });

    it('should extract all unique user IDs', () => {
      expect(result).toEqual(['user1', 'user3', 'user2', 'user4']);
    });
  });

});
