import DocumentStore from '../stores/document-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';

class StatisticsService {
  static dependencies = [DocumentStore, MediaLibraryItemStore];

  constructor(documentStore, mediaLibraryItemStore) {
    this.documentStore = documentStore;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
  }

  async getItemsWithTagsCount() {
    const tagMap = new Map();
    const addToMap = async (cursor, tagMapEntryKey) => {
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
        entry[tagMapEntryKey] = item.count;
        entry.totalCount += item.count;
      }
    };

    await Promise.all([
      this.documentStore.getPublicNonArchivedDocumentTagsWithCountsCursor().then(cursor => addToMap(cursor, 'documentCount')),
      this.mediaLibraryItemStore.getMediaLibraryItemTagsWithCountsCursor().then(cursor => addToMap(cursor, 'mediaLibraryItemCount'))
    ]);

    return [...tagMap.values()];
  }
}

export default StatisticsService;
