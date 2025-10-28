import by from 'thenby';
import DocumentStore from '../stores/document-store.js';
import SearchRequestStore from '../stores/search-request-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';

class StatisticsService {
  static dependencies = [DocumentStore, MediaLibraryItemStore, SearchRequestStore];

  constructor(documentStore, mediaLibraryItemStore, searchRequestStore) {
    this.documentStore = documentStore;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
    this.searchRequestStore = searchRequestStore;
  }

  async getTagsWithUsageCounts() {
    const tagMap = new Map();
    const addToMap = async (cursor, tagMapKey) => {
      for await (const item of cursor) {
        let entry = tagMap.get(item._id);
        if (!entry) {
          entry = {
            tag: item._id,
            documentCount: 0,
            mediaLibraryItemCount: 0,
            totalCount: 0
          };
          tagMap.set(item._id, entry);
        }
        if (item.count) {
          entry[tagMapKey] = item.count;
          entry.totalCount += item.count;
        }
      }
    };

    await Promise.all([
      addToMap(this.documentStore.getPublicNonArchivedDocumentTagsWithCountsCursor(), 'documentCount'),
      addToMap(this.mediaLibraryItemStore.getMediaLibraryItemTagsWithCountsCursor(), 'mediaLibraryItemCount')
    ]);

    return { tags: [...tagMap.values()] };
  }

  async getTagUsageDetails({ tag }) {
    const documents = [];
    const mediaLibraryItems = [];
    const companionTagMap = new Map();

    const countCompanionTags = tagsFromDocumentOrMediaLibraryItem => {
      for (const otherTag of tagsFromDocumentOrMediaLibraryItem) {
        if (otherTag !== tag) {
          const currentCount = companionTagMap.get(otherTag) || 0;
          companionTagMap.set(otherTag, currentCount + 1);
        }
      }
    };

    const addDocuments = async documentsCursor => {
      for await (const document of documentsCursor) {
        documents.push({
          _id: document._id,
          slug: document.slug,
          title: document.title
        });
        countCompanionTags(document.tags);
      }
    };

    const addMediaLibraryItem = async mediaLibraryItemsCursor => {
      for await (const mediaLibraryItem of mediaLibraryItemsCursor) {
        mediaLibraryItems.push({
          _id: mediaLibraryItem._id,
          name: mediaLibraryItem.name
        });
        countCompanionTags(mediaLibraryItem.tags);
      }
    };

    await Promise.all([
      addDocuments(this.documentStore.getPublicNonArchivedDocumentsMinimalMetadataWithTagsCursorByTag(tag)),
      addMediaLibraryItem(this.mediaLibraryItemStore.getMediaLibraryItemsNameAndTagsCursorByTag(tag))
    ]);

    return {
      documents: documents.sort(by(doc => doc.title)),
      mediaLibraryItems: mediaLibraryItems.sort(by(item => item.name)),
      companionTags: [...companionTagMap.entries()]
        .map(([key, value]) => ({ tag: key, count: value }))
        .sort(by(entry => entry.count, 'desc'))
    };
  }

  getSearchRequests() {
    return this.searchRequestStore.getAllSearchRequests();
  }
}

export default StatisticsService;
