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
  let user1;
  let user2;
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

    user1 = await createTestUser(container, { email: 'john-doe@test.com', password: 'john-doe-12345$$$', displayName: 'John Doe' });
    user2 = await createTestUser(container, { email: 'jane-doe@test.com', password: 'jane-doe-12345$$$', displayName: 'Jane Doe' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createDocumentCategory', () => {

    describe('when the name is not unique', () => {
      beforeEach(async () => {
        await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: '',
          description: '',
          user: user1
        });

        result = await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: '',
          description: '',
          user: user1
        });
      });

      it('returns the duplicateName result without a created documentCategory', () => {
        expect(result).toStrictEqual({
          result: SAVE_DOCUMENT_CATEGORY_RESULT.duplicateName,
          documentCategory: null
        });
      });
    });

    describe('when the name is unique', () => {
      beforeEach(async () => {
        result = await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: 'cdn://media-library/icon.svg',
          description: '[Click here](cdn://media-library/file.png)',
          user: user1
        });
      });

      it('returns the success result containing the created document category', () => {
        expect(result).toStrictEqual({
          result: SAVE_DOCUMENT_CATEGORY_RESULT.success,
          documentCategory: {
            _id: expect.stringMatching(/\w+/),
            name: 'category1',
            iconUrl: 'cdn://media-library/icon.svg',
            description: '[Click here](cdn://media-library/file.png)',
            documentIds: [],
            cdnResources: ['cdn://media-library/file.png', 'cdn://media-library/icon.svg'],
            createdOn: now,
            createdBy: user1._id,
            updatedOn: now,
            updatedBy: user1._id
          }
        });
      });
    });
  });

  describe('updateDocumentCategory', () => {
    let oldDocumentCategory;

    describe('when the updated name is not unique', () => {
      beforeEach(async () => {
        await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: '',
          description: '',
          user: user1
        });

        const creationResult = await sut.createDocumentCategory({
          name: 'category2',
          iconUrl: 'cdn://media-library/old-icon.svg',
          description: '[Click here](cdn://media-library/old-file.png)',
          user: user1
        });

        oldDocumentCategory = creationResult.documentCategory;

        result = await sut.updateDocumentCategory({
          documentCategoryId: oldDocumentCategory._id,
          name: 'category1',
          iconUrl: 'cdn://media-library/new-icon.svg',
          description: '[Click here](cdn://media-library/new-file.png)',
          user: user2
        });
      });

      it('returns the duplicateName result with the old documentCategory data', () => {
        expect(result).toStrictEqual({
          result: SAVE_DOCUMENT_CATEGORY_RESULT.duplicateName,
          documentCategory: {
            ...oldDocumentCategory
          }
        });
      });
    });

    describe('when the updated name is unique', () => {
      beforeEach(async () => {
        await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: '',
          description: '',
          user: user1
        });

        const creationResult = await sut.createDocumentCategory({
          name: 'category2',
          iconUrl: 'cdn://media-library/old-icon.svg',
          description: '[Click here](cdn://media-library/old-file.png)',
          user: user1
        });

        oldDocumentCategory = creationResult.documentCategory;

        result = await sut.updateDocumentCategory({
          documentCategoryId: oldDocumentCategory._id,
          name: 'category3',
          iconUrl: 'cdn://media-library/new-icon.svg',
          description: '[Click here](cdn://media-library/new-file.png)',
          user: user2
        });
      });

      it('returns the success result containing the updated document category', () => {
        expect(result).toStrictEqual({
          result: SAVE_DOCUMENT_CATEGORY_RESULT.success,
          documentCategory: {
            ...oldDocumentCategory,
            name: 'category3',
            iconUrl: 'cdn://media-library/new-icon.svg',
            description: '[Click here](cdn://media-library/new-file.png)',
            documentIds: [],
            cdnResources: ['cdn://media-library/new-file.png', 'cdn://media-library/new-icon.svg'],
            updatedOn: now,
            updatedBy: user2._id
          }
        });
      });
    });

    describe('when the name hasn\'t changed', () => {
      beforeEach(async () => {
        await sut.createDocumentCategory({
          name: 'category1',
          iconUrl: '',
          description: '',
          user: user1
        });

        const creationResult = await sut.createDocumentCategory({
          name: 'category2',
          iconUrl: 'cdn://media-library/old-icon.svg',
          description: '[Click here](cdn://media-library/old-file.png)',
          user: user1
        });

        oldDocumentCategory = creationResult.documentCategory;

        result = await sut.updateDocumentCategory({
          documentCategoryId: oldDocumentCategory._id,
          name: 'category2',
          iconUrl: 'cdn://media-library/new-icon.svg',
          description: '[Click here](cdn://media-library/new-file.png)',
          user: user2
        });
      });

      it('returns the success result containing the updated document category', () => {
        expect(result).toStrictEqual({
          result: SAVE_DOCUMENT_CATEGORY_RESULT.success,
          documentCategory: {
            ...oldDocumentCategory,
            name: 'category2',
            iconUrl: 'cdn://media-library/new-icon.svg',
            description: '[Click here](cdn://media-library/new-file.png)',
            documentIds: [],
            cdnResources: ['cdn://media-library/new-file.png', 'cdn://media-library/new-icon.svg'],
            updatedOn: now,
            updatedBy: user2._id
          }
        });
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
        user: user1
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
