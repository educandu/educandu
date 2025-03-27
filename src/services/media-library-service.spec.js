import by from 'thenby';
import { createSandbox } from 'sinon';
import uniqueId from '../utils/unique-id.js';
import MediaLibraryService from './media-library-service.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { RESOURCE_TYPE, RESOURCE_USAGE, ROLE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  createTestUser,
  createTestDocument,
  createTestSection,
  updateTestDocument,
  createTestRoom,
  createTestSetting,
  createTestDocumentCategory
} from '../test-helper.js';

async function createTestMediaLibraryItem(sut, user, { tags, name }) {
  const file = {
    key: uniqueId.create(),
    size: 100,
    originalname: name || `${uniqueId.create()}.mp3`,
  };

  const metadata = {
    shortDescription: '',
    languages: [],
    allRightsReserved: false,
    licenses: ['CC0-1.0'],
    tags: tags || ['test'],
  };

  const createdMediaLibraryItem = await sut.createMediaLibraryItem({ file, metadata, user });
  return createdMediaLibraryItem;
}

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
    let result;
    let createdMediaLibraryItem;

    describe('when an item is referenced from an unarchived document', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${createdMediaLibraryItem.url})`
          }
        });
        await createTestDocument(container, user, { sections: [section] });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });

    describe('when an item is referenced from an archived document only', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${createdMediaLibraryItem.url})`
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
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.deprecated);
      });
    });

    describe('when an item is referenced from an earlier document revision only', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        const section = createTestSection({
          key: uniqueId.create(),
          type: MarkdownInfo.typeName,
          content: {
            ...markdownInfo.getDefaultContent(),
            text: `I [link this](${createdMediaLibraryItem.url})`
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
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.deprecated);
      });
    });

    describe('when an item is not referenced from anywhere at all', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        result = await sut.getAllMediaLibraryItemsWithUsage();
      });
      it('has usage `unused`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.unused);
      });
    });

    describe('when an item is referenced from a document category', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        await createTestDocumentCategory(
          container,
          user,
          {
            description: `Download [this file](${createdMediaLibraryItem.url}), please!`
          }
        );

        result = await sut.getAllMediaLibraryItemsWithUsage();
      });

      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });

    describe('when an item is referenced from a user', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        await createTestUser(
          container,
          {
            email: 'other-user@test.com',
            role: ROLE.user,
            profileOverview:  `I [link this](${createdMediaLibraryItem.url})`
          });

        result = await sut.getAllMediaLibraryItemsWithUsage();
      });

      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });

    describe('when an item is referenced from a room', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        await createTestRoom(
          container,
          {
            ownedBy: user._id,
            overview: `I [link this](${createdMediaLibraryItem.url})`
          });

        result = await sut.getAllMediaLibraryItemsWithUsage();
      });

      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });

    describe('when an item is referenced from a consentText setting', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        await createTestSetting(
          container,
          {
            name: 'consentText',
            value: {
              en: `I [link this](${createdMediaLibraryItem.url})`
            }
          });

        result = await sut.getAllMediaLibraryItemsWithUsage();
      });

      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });

    describe('when an item is referenced from a pluginsHelpTexts setting', () => {
      beforeEach(async () => {
        createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
        await createTestSetting(
          container,
          {
            name: 'pluginsHelpTexts',
            value: {
              markdown: {
                en: `I [link this](${createdMediaLibraryItem.url})`
              }
            }
          });

        result = await sut.getAllMediaLibraryItemsWithUsage();
      });

      it('has usage `used`', () => {
        expect(result.find(x => x.url === createdMediaLibraryItem.url).usage).toBe(RESOURCE_USAGE.used);
      });
    });
  });

  describe('getSearchableMediaLibraryItems', () => {
    let item1;
    let item2;
    let item3;
    let result;

    beforeEach(async () => {
      item1 = await createTestMediaLibraryItem(sut, user, {
        name: 'item1.txt',
        tags: ['a', 'shared', 'part', 'clever']
      });
      item2 = await createTestMediaLibraryItem(sut, user, {
        name: 'item2.txt',
        tags: ['b', 'shared', 'part', 'clever']
      });
      item3 = await createTestMediaLibraryItem(sut, user, {
        name: 'item3.txt',
        tags: ['c', 'shared', 'partial', 'smart', 'matches-also-item2']
      });
    });

    describe('when the query does not match any search token', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'fantastic', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the an empty result list', () => {
        expect(result.sort(by(x => x.name))).toEqual([]);
      });
    });

    describe('when the query is shorter than 3 characters and exactly matches the search token of one item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'a', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single items', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }]);
      });
    });

    describe('when the query is longer than 3 characters and exactly or partially matches the search tokens of multiple items', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'part', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return items with exact and partial match, with exact matches having higher relevance', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }, { ...item2, relevance: 1 }, { ...item3, relevance: 0 }]);
      });
    });

    describe('when the query contains 2 tokens longer than 3 characters and partially matches the search tokens of two items', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'ared ever', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return only the the two items where each individual item matches all tokens', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 0 }, { ...item2, relevance: 0 }]);
      });
    });

    describe('when the query partially matches a search token in each item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: '.txt', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return all items', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 0 }, { ...item2, relevance: 0 }, { ...item3, relevance: 0 }]);
      });
    });

    describe('when the query partially matches a search token in one item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'item1', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single item', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 0 }]);
      });
    });

    describe('when the query partially matches different search tokens in two item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'item2', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return both items with same relevance', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item2, relevance: 0 }, { ...item3, relevance: 0 }]);
      });
    });

    describe('when the query contains 2 tokens where one is a full match and one is a partial match on one single item', () => {
      beforeEach(async () => {
        result = await sut.getSearchableMediaLibraryItems({ query: 'item1 clever', resourceTypes: Object.values(RESOURCE_TYPE) });
      });
      it('should return the single item', () => {
        expect(result.sort(by(x => x.name))).toStrictEqual([{ ...item1, relevance: 1 }]);
      });
    });
  });
});
