import by from 'thenby';
import { createSandbox } from 'sinon';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import MediaLibraryService from './media-library-service.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { getMediaLibraryPath } from '../utils/storage-utils.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CDN_URL_PREFIX, RESOURCE_TYPE, RESOURCE_USAGE, ROLE } from '../domain/constants.js';
import {
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  createTestUser,
  createTestMediaLibraryItem,
  createTestDocument,
  createTestSection,
  updateTestDocument
} from '../test-helper.js';

describe('media-library-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let maintainerUser;
  let markdownInfo;
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    maintainerUser = await createTestUser(container, { email: 'maintaner@test.com', role: ROLE.maintainer });
    user = await createTestUser(container, { email: 'user@test.com', role: ROLE.user });
    markdownInfo = container.get(MarkdownInfo);
    sut = container.get(MediaLibraryService);
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

  describe('getAllMediaLibraryItemsWithUsage', () => {
    const itemUrl = `${CDN_URL_PREFIX}${urlUtils.concatParts(getMediaLibraryPath(), 'item1.txt')}`;
    let result;
    describe('when an item is referenced from an unarchived document', () => {
      beforeEach(async () => {
        await createTestMediaLibraryItem(container, user, { url: itemUrl });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${itemUrl})`
          }
        });
        await createTestDocument(container, user, { sections: [section] });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `used`', () => {
        expect(result.find(x => x.url === itemUrl).usage).toBe(RESOURCE_USAGE.used);
      });
    });
    describe('when an item is referenced from an archived document only', () => {
      beforeEach(async () => {
        await createTestMediaLibraryItem(container, user, { url: itemUrl });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${itemUrl})`
          }
        });
        const doc = await createTestDocument(container, user, { sections: [section] });
        await updateTestDocument({
          container,
          user: maintainerUser,
          documentId: doc._id,
          data: {
            publicContext: { archived: true }
          }
        });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `deprecated`', () => {
        expect(result.find(x => x.url === itemUrl).usage).toBe(RESOURCE_USAGE.deprecated);
      });
    });
    describe('when an item is referenced from an earlier document revision only', () => {
      beforeEach(async () => {
        await createTestMediaLibraryItem(container, user, { url: itemUrl });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${itemUrl})`
          }
        });
        const doc = await createTestDocument(container, user, { sections: [section] });
        await updateTestDocument({
          container,
          user: maintainerUser,
          documentId: doc._id,
          data: {
            sections: [
              {
                ...doc.sections[0],
                content: {
                  ...doc.sections[0].content,
                  text: 'I do not link it anymore!'
                }
              }
            ]
          }
        });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `deprecated`', () => {
        expect(result.find(x => x.url === itemUrl).usage).toBe(RESOURCE_USAGE.deprecated);
      });
    });
    describe('when an item is not referenced from a document at all', () => {
      beforeEach(async () => {
        await createTestMediaLibraryItem(container, user, { url: itemUrl });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `unused`', () => {
        expect(result.find(x => x.url === itemUrl).usage).toBe(RESOURCE_USAGE.unused);
      });
    });
  });

  describe('getSearchableMediaLibraryItemsByTagsOrName', () => {
    let item1;
    let item2;
    let item3;
    let result;

    beforeEach(async () => {
      item1 = await createTestMediaLibraryItem(container, user, {
        url: `${CDN_URL_PREFIX}${urlUtils.concatParts(getMediaLibraryPath(), 'item1.txt')}`,
        tags: ['a', 'shared', 'part', 'clever']
      });
      item2 = await createTestMediaLibraryItem(container, user, {
        url: `${CDN_URL_PREFIX}${urlUtils.concatParts(getMediaLibraryPath(), 'item2.txt')}`,
        tags: ['b', 'shared', 'part', 'clever']
      });
      item3 = await createTestMediaLibraryItem(container, user, {
        url: `${CDN_URL_PREFIX}${urlUtils.concatParts(getMediaLibraryPath(), 'item3.txt')}`,
        tags: ['c', 'shared', 'partial', 'smart', 'matches-also-item2']
      });
    });

    describe('when the query does not match any tag or name', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'fantastic', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the an empty result list', () => {
        expect(result.sort(by(x => x.name))).toEqual([]);
      });
    });

    describe('when the query is shorter than 3 characters and exactly matches the tag of one item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'a', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single items', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }]);
      });
    });

    describe('when the query is longer than 3 characters and exactly or partially matches the tags of multiple items', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'part', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return items with exact and partial tag match, with exact matches having higher relevance', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }, { ...item2, relevance: 1 }, { ...item3, relevance: 0 }]);
      });
    });

    describe('when the query contains 2 tokens longer than 3 characters and partially matches the tags of two items', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'ared ever', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return only the the two items where each individual item matches all tokens', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 0 }, { ...item2, relevance: 0 }]);
      });
    });

    describe('when the query partially matches the names of multiple items', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: '.txt', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return all items where the file name matches partially', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }, { ...item2, relevance: 1 }, { ...item3, relevance: 1 }]);
      });
    });

    describe('when the query partially matches the names of only one item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'item1', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single item', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }]);
      });
    });

    describe('when the query matches the name of one item and the tag of one other item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'item2', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return both items with the tag match having the higher relevance', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item2, relevance: 1 }, { ...item3, relevance: 0 }]);
      });
    });

    describe('when the query contains 2 tokens where one matches the name and one the tag', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItemsByTagsOrName({ query: 'item1 clever', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single item', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 2 }]);
      });
    });
  });
});
