import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import DocumentCategoryService from './document-category-service.js';
import { SAVE_DOCUMENT_CATEGORY_RESULT } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser
} from '../test-helper.js';

describe('document-category-service', () => {
  let db;
  let sut;
  let user;
  let result;
  let container;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    sut = container.get(DocumentCategoryService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    user = await createTestUser(container, { email: 'john-doe@test.com', password: 'john-doe-12345$$$', displayName: 'John Doe' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createDocumentCategory', () => {
    beforeEach(async () => {
      result = await sut.createDocumentCategory({
        name: 'name',
        iconUrl: 'cdn://media-library/icon.svg',
        description: '[Click here](cdn://media-library/file-1.png)',
        user
      });
    });

    it('returns the success result containing the created document category', () => {
      expect(result).toStrictEqual({
        result: SAVE_DOCUMENT_CATEGORY_RESULT.success,
        documentCategory: {
          _id: expect.stringMatching(/\w+/),
          name: 'name',
          iconUrl: 'cdn://media-library/icon.svg',
          description: '[Click here](cdn://media-library/file-1.png)',
          documentIds: [],
          cdnResources: ['cdn://media-library/file-1.png', 'cdn://media-library/icon.svg'],
          createdOn: now,
          createdBy: user._id,
          updatedOn: now,
          updatedBy: user._id
        }
      });
    });
  });

  describe('consolidateCdnResources', () => {
    let documentCategoryBeforeConsolidation;

    beforeEach(async () => {
      const creationResult = await sut.createDocumentCategory({
        name: 'name',
        iconUrl: '',
        description: '',
        user
      });
      const documentCategoryId = creationResult.documentCategory._id;

      await db.documentCategories.updateOne(
        { _id: documentCategoryId },
        {
          $set: {
            iconUrl: 'cdn://media-library/icon.svg',
            description: '[Click here](cdn://media-library/file-1.png)',
          }
        }
      );

      documentCategoryBeforeConsolidation = await db.documentCategories.findOne({ _id: documentCategoryId });

      await sut.consolidateCdnResources(documentCategoryBeforeConsolidation._id);

      result = await db.documentCategories.findOne({ _id: documentCategoryId });
    });

    it('updates the document category with correctly consolidated cdnResources list', () => {
      expect(result).toStrictEqual({
        ...documentCategoryBeforeConsolidation,
        cdnResources: ['cdn://media-library/file-1.png', 'cdn://media-library/icon.svg']
      });
    });
  });
});
