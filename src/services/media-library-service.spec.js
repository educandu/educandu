import by from 'thenby';
import Cdn from '../stores/cdn.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { assert, createSandbox } from 'sinon';
import MediaLibraryService from './media-library-service.js';
import { RESOURCE_TYPE, ROLE } from '../domain/constants.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { getMediaLibraryPath, getMediaTrashPath } from '../utils/storage-utils.js';
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
    tags: tags || ['test']
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
  let cdn;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    markdownInfo = container.get(MarkdownInfo);
    sut = container.get(MediaLibraryService);
    cdn = container.get(Cdn);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    maintainerUser = await createTestUser(container, { email: 'maintaner@test.com', role: ROLE.maintainer });
    user = await createTestUser(container, { email: 'user@test.com', role: ROLE.user });
    sandbox.useFakeTimers(now);
    sandbox.stub(cdn, 'moveObject').resolves();
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getAllMediaLibraryItemsWithUsage', () => {
    let result;
    let createdMediaLibraryItem;

    describe('when fromTrash is false', () => {
      describe('when an item is not referenced from anywhere at all', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'unused-item.txt' });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `X`', () => {
          expect(result.find(x => x.key === createdMediaLibraryItem._id).usage).toBe('X');
        });
        it('has the correct structure', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item).toHaveProperty('key');
          expect(item).toHaveProperty('mediaLibraryItem');
          expect(item).toHaveProperty('mediaTrashItem');
          expect(item).toHaveProperty('usage');
          expect(item.mediaTrashItem).toBeNull();
        });
        it('includes user details in createdBy and updatedBy', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.mediaLibraryItem.createdBy).toHaveProperty('_id');
          expect(item.mediaLibraryItem.createdBy).toHaveProperty('displayName');
          expect(item.mediaLibraryItem.updatedBy).toHaveProperty('_id');
          expect(item.mediaLibraryItem.updatedBy).toHaveProperty('displayName');
        });
      });

      describe('when an item is referenced from an unarchived document', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'doc-item.txt' });
          const section = createTestSection({
            key: uniqueId.create(),
            type: MarkdownInfo.typeName,
            content: {
              ...markdownInfo.getDefaultContent(),
              text: `I [link this](${createdMediaLibraryItem.url})`
            }
          });
          await createTestDocument(container, user, { sections: [section] });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `DH`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('DH');
        });
      });

      describe('when an item is referenced from an archived document only', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'archived-doc-item.txt' });
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
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `A`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('A');
        });
      });

      describe('when an item is referenced from an earlier document revision only', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'history-item.txt' });
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
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `H`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('H');
        });
      });

      describe('when an item is referenced from a document category', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'category-item.txt' });
          await createTestDocumentCategory(
            container,
            user,
            {
              description: `Download [this file](${createdMediaLibraryItem.url}), please!`
            }
          );
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `C`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('C');
        });
      });

      describe('when an item is referenced from a user', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'user-profile-item.txt' });
          await createTestUser(
            container,
            {
              email: 'other-user@test.com',
              role: ROLE.user,
              profileOverview: `I [link this](${createdMediaLibraryItem.url})`
            });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `U`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('U');
        });
      });

      describe('when an item is referenced from a room', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'room-item.txt' });
          await createTestRoom(
            container,
            {
              ownedBy: user._id,
              overview: `I [link this](${createdMediaLibraryItem.url})`
            });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `R`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('R');
        });
      });

      describe('when an item is referenced from a consentText setting', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'consent-item.txt' });
          await createTestSetting(
            container,
            {
              name: 'consentText',
              value: {
                en: `I [link this](${createdMediaLibraryItem.url})`
              }
            });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `S`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('S');
        });
      });

      describe('when an item is referenced from a pluginsHelpTexts setting', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'help-item.txt' });
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
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `S`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('S');
        });
      });

      describe('when an item is referenced from multiple places', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'multi-ref-item.txt' });
          const section = createTestSection({
            key: uniqueId.create(),
            type: MarkdownInfo.typeName,
            content: {
              ...markdownInfo.getDefaultContent(),
              text: `I [link this](${createdMediaLibraryItem.url})`
            }
          });
          await createTestDocument(container, user, { sections: [section] });
          await createTestDocumentCategory(
            container,
            user,
            {
              description: `Download [this file](${createdMediaLibraryItem.url}), please!`
            }
          );
          await createTestUser(
            container,
            {
              email: 'other-user@test.com',
              role: ROLE.user,
              profileOverview: `I [link this](${createdMediaLibraryItem.url})`
            });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: false });
        });
        it('has usage `DHCU`', () => {
          const item = result.find(x => x.key === createdMediaLibraryItem._id);
          expect(item.usage).toBe('DHCU');
        });
      });
    });

    describe('when fromTrash is true', () => {
      let deletedMediaLibraryItem;

      describe('when a trash item is not referenced from anywhere at all', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item1.txt' });
          deletedMediaLibraryItem = await db.mediaLibraryItems.findOne({ _id: createdMediaLibraryItem._id });
          await sut.deleteMediaLibraryItem({ mediaLibraryItemId: createdMediaLibraryItem._id, user });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: true });
        });
        it('has usage `X`', () => {
          expect(result.find(x => x.mediaLibraryItem._id === createdMediaLibraryItem._id).usage).toBe('X');
        });
        it('has the correct structure', () => {
          const item = result.find(x => x.mediaLibraryItem._id === createdMediaLibraryItem._id);
          expect(item).toHaveProperty('key');
          expect(item).toHaveProperty('mediaLibraryItem');
          expect(item).toHaveProperty('mediaTrashItem');
          expect(item).toHaveProperty('usage');
          expect(item.mediaTrashItem).not.toBeNull();
          expect(item.mediaTrashItem).toHaveProperty('expiresOn');
        });
        it('includes the original item data in mediaLibraryItem', () => {
          const item = result.find(x => x.mediaLibraryItem._id === createdMediaLibraryItem._id);
          expect(item.mediaLibraryItem.name).toBe(deletedMediaLibraryItem.name);
          expect(item.mediaLibraryItem.size).toBe(deletedMediaLibraryItem.size);
          expect(item.mediaLibraryItem.resourceType).toBe(deletedMediaLibraryItem.resourceType);
        });
      });

      describe('when a trash item is referenced from an unarchived document', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item2.txt' });
          const section = createTestSection({
            key: uniqueId.create(),
            type: MarkdownInfo.typeName,
            content: {
              ...markdownInfo.getDefaultContent(),
              text: `I [link this](${createdMediaLibraryItem.url})`
            }
          });
          await createTestDocument(container, user, { sections: [section] });
          await sut.deleteMediaLibraryItem({ mediaLibraryItemId: createdMediaLibraryItem._id, user });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: true });
        });
        it('has usage `DH`', () => {
          const item = result.find(x => x.mediaLibraryItem._id === createdMediaLibraryItem._id);
          expect(item.usage).toBe('DH');
        });
      });

      describe('when a trash item is referenced from multiple places', () => {
        beforeEach(async () => {
          createdMediaLibraryItem = await createTestMediaLibraryItem(sut, user, { name: 'item3.txt' });
          const section = createTestSection({
            key: uniqueId.create(),
            type: MarkdownInfo.typeName,
            content: {
              ...markdownInfo.getDefaultContent(),
              text: `I [link this](${createdMediaLibraryItem.url})`
            }
          });
          await createTestDocument(container, user, { sections: [section] });
          await createTestRoom(
            container,
            {
              ownedBy: user._id,
              overview: `I [link this](${createdMediaLibraryItem.url})`
            });
          await sut.deleteMediaLibraryItem({ mediaLibraryItemId: createdMediaLibraryItem._id, user });
          result = await sut.getAllMediaLibraryItemsWithUsage({ fromTrash: true });
        });
        it('has usage `DHR`', () => {
          const item = result.find(x => x.mediaLibraryItem._id === createdMediaLibraryItem._id);
          expect(item.usage).toBe('DHR');
        });
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

  describe('deleteMediaLibraryItem', () => {
    describe('when the mediaLibraryItem does not exist', () => {
      beforeEach(async () => {
        await sut.deleteMediaLibraryItem({ mediaLibraryItemId: 'non-existing-id', user });
      });

      it('should not call the CDN', () => {
        assert.notCalled(cdn.moveObject);
      });
    });

    describe('when the mediaLibraryItem and the matching CDN file exist', () => {
      let mediaLibraryItemBeforeDeletion;
      let mediaLibraryItemAfterDeletion;
      let createdMediaTrashItem;

      beforeEach(async () => {
        const createdTestItem = await createTestMediaLibraryItem(sut, user, { name: 'some-item.txt' });

        mediaLibraryItemBeforeDeletion = await db.mediaLibraryItems.findOne({ _id: createdTestItem._id });
        await sut.deleteMediaLibraryItem({ mediaLibraryItemId: mediaLibraryItemBeforeDeletion._id, user });
        mediaLibraryItemAfterDeletion = await db.mediaLibraryItems.findOne({ _id: mediaLibraryItemBeforeDeletion._id });
        createdMediaTrashItem = await db.mediaTrashItems.findOne({ 'originalItem._id': mediaLibraryItemBeforeDeletion._id });
      });

      it('should delete the media library item', () => {
        expect(mediaLibraryItemAfterDeletion).toBeNull();
      });

      it('should create the media trash item', () => {
        expect(createdMediaTrashItem?.originalItem).toStrictEqual(mediaLibraryItemBeforeDeletion);
      });

      it('should call the CDN to move the file', () => {
        assert.calledWith(
          cdn.moveObject,
          `${getMediaLibraryPath()}/${mediaLibraryItemBeforeDeletion.name}`,
          `${getMediaTrashPath()}/${mediaLibraryItemBeforeDeletion.name}`
        );
      });
    });

    describe('when the mediaLibraryItem exists, but the matching CDN file does not exist', () => {
      let mediaLibraryItemBeforeDeletion;
      let mediaLibraryItemAfterDeletion;
      let createdMediaTrashItem;

      beforeEach(async () => {
        const createdTestItem = await createTestMediaLibraryItem(sut, user, { name: 'some-item.txt' });

        cdn.moveObject.rejects(new Error('Not Found'));

        mediaLibraryItemBeforeDeletion = await db.mediaLibraryItems.findOne({ _id: createdTestItem._id });
        await sut.deleteMediaLibraryItem({ mediaLibraryItemId: mediaLibraryItemBeforeDeletion._id, user });
        mediaLibraryItemAfterDeletion = await db.mediaLibraryItems.findOne({ _id: mediaLibraryItemBeforeDeletion._id });
        createdMediaTrashItem = await db.mediaTrashItems.findOne({ 'originalItem._id': mediaLibraryItemBeforeDeletion._id });
      });

      it('should delete the media library item', () => {
        expect(mediaLibraryItemAfterDeletion).toBeNull();
      });

      it('should create the media trash item', () => {
        expect(createdMediaTrashItem?.originalItem).toStrictEqual(mediaLibraryItemBeforeDeletion);
      });

      it('should call the CDN to move the file', () => {
        assert.calledWith(
          cdn.moveObject,
          `${getMediaLibraryPath()}/${mediaLibraryItemBeforeDeletion.name}`,
          `${getMediaTrashPath()}/${mediaLibraryItemBeforeDeletion.name}`
        );
      });
    });

  });
});
