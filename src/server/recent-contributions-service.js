import DocumentStore from '../stores/document-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';

const MAX_DAYS_SINCE_CONTRIBUTION = 90;

class RecentContributionsService {
  static dependencies = [DocumentStore, MediaLibraryItemStore];

  constructor(documentStore, mediaLibraryItemStore) {
    this.documentStore = documentStore;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
  }

  async getRecentDocuments({ page, pageSize }) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - MAX_DAYS_SINCE_CONTRIBUTION);

    const conditions = [
      { roomId: null },
      { 'publicContext.archived': false },
      { updatedOn: { $gt: dateLimit } }
    ];
    const { documents, totalCount } = await this.documentStore.getDocumentsExtendedMetadataPageByConditions(conditions, { page, pageSize });

    return { documents, totalCount };
  }

  async getRecentMediaLibraryItems({ page, pageSize }) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - MAX_DAYS_SINCE_CONTRIBUTION);

    const conditions = [{ updatedOn: { $gt: dateLimit } }];
    const { mediaLibraryItems, totalCount } = await this.mediaLibraryItemStore.getMediaLibraryItemsPageByConditions(conditions, { page, pageSize });

    return { mediaLibraryItems, totalCount };
  }
}

export default RecentContributionsService;
