import DocumentStore from '../stores/document-store.js';

const MAX_DAYS_SINCE_CONTRIBUTION = 90;

class RecentContributionsService {
  static dependencies = [DocumentStore];

  constructor(documentStore) {
    this.documentStore = documentStore;
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
}

export default RecentContributionsService;
