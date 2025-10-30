import by from 'thenby';
import UserStore from '../stores/user-store.js';
import DocumentStore from '../stores/document-store.js';
import SearchRequestStore from '../stores/search-request-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';
import DailyDocumentRequestStore from '../stores/daily-document-request-store.js';

class StatisticsService {
  static dependencies = [DocumentStore, DocumentRevisionStore, DailyDocumentRequestStore, MediaLibraryItemStore, UserStore, SearchRequestStore];

  constructor(documentStore, documentRevisionStore, dailyDocumentRequestStore, mediaLibraryItemStore, userStore, searchRequestStore) {
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
    this.dailyDocumentRequestStore = dailyDocumentRequestStore;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
    this.userStore = userStore;
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

    return [...tagMap.values()];
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

  async getAllDocumentRequestCounters({ registeredFrom, registeredUntil, daysOfWeek } = {}) {
    const documentsById = await this.documentStore.getAllPublicDocumentsMinimalMetadata().then(documents => {
      return new Map(documents.map(document => [document._id, document]));
    });

    const mergedCounters = [];
    const countersCursor = this.dailyDocumentRequestStore.getAllDocumentRequestCountersCursor({ registeredFrom, registeredUntil, daysOfWeek });

    for await (const counter of countersCursor) {
      const document = documentsById.get(counter.documentId);
      if (document) {
        mergedCounters.push({
          documentId: counter._id,
          documentSlug: document.slug,
          documentTitle: document.title,
          totalCount: counter.totalCount,
          readCount: counter.readCount,
          writeCount: counter.writeCount,
          anonymousCount: counter.anonymousCount,
          loggedInCount: counter.loggedInCount
        });
      }
    }

    return mergedCounters;
  }

  getSearchRequests() {
    return this.searchRequestStore.getAllSearchRequests();
  }

  async getUserContributions({ contributedFrom, contributedUntil }) {
    const [usersById, documentsById] = await Promise.all([
      this.userStore.getAllUserIdsAndDisplayNames().then(users => new Map(users.map(user => [user._id, user]))),
      this.documentStore.getAllPublicDocumentsCreationMetadata().then(documents => new Map(documents.map(document => [document._id, document])))
    ]);

    const contributionsByUserId = new Map();
    const revisionsCursor = await this.documentRevisionStore.getAllPublicDocumentRevisionCreationMetadataCursorInInterval({ contributedFrom, contributedUntil });

    for await (const revision of revisionsCursor) {
      const user = usersById.get(revision.createdBy);
      const document = documentsById.get(revision.documentId);

      if (user && document) {
        let resultEntry = contributionsByUserId.get(user._id);

        if (!resultEntry) {
          resultEntry = {
            userId: user._id,
            userDisplayName: user.displayName,
            ownDocumentsContributedTo: new Set(),
            otherDocumentsContributedTo: new Set(),
            documentsCreated: new Set()
          };
          contributionsByUserId.set(user._id, resultEntry);
        }

        const isFirstRevision = document.createdOn.valueOf() === revision.createdOn.valueOf();
        const isOwnDocument = document.createdBy === user._id;

        if (isOwnDocument) {
          resultEntry.ownDocumentsContributedTo.add(document._id);
        } else {
          resultEntry.otherDocumentsContributedTo.add(document._id);
        }

        if (isFirstRevision) {
          resultEntry.documentsCreated.add(document._id);
        }
      }
    }

    const userContributions = [];
    for (const element of contributionsByUserId.values()) {
      userContributions.push({
        userId: element.userId,
        userDisplayName: element.userDisplayName,
        ownDocumentsContributedToCount: element.ownDocumentsContributedTo.size,
        otherDocumentsContributedToCount: element.otherDocumentsContributedTo.size,
        documentsCreatedCount: element.documentsCreated.size
      });
    }

    return userContributions;
  }

  async getUserContributionsDetails({ userId, contributedFrom, contributedUntil }) {
    const documentsById = await this.documentStore.getAllPublicDocumentsCreationMetadata().then(documents => {
      return new Map(documents.map(document => [document._id, document]));
    });

    const ownDocumentsContributedTo = new Set();
    const otherDocumentsContributedTo = new Set();
    const documentsCreated = new Set();
    const affectedDocumentIds = new Set();

    const revisionsCursor = await this.documentRevisionStore.getAllPublicDocumentRevisionCreationMetadataCursorInInterval({ createdBy: userId, contributedFrom, contributedUntil });

    for await (const revision of revisionsCursor) {
      const document = documentsById.get(revision.documentId);
      if (document) {
        affectedDocumentIds.add(document._id);

        const isFirstRevision = document.createdOn.valueOf() === revision.createdOn.valueOf();
        const isOwnDocument = document.createdBy === userId;

        if (isOwnDocument) {
          ownDocumentsContributedTo.add(document._id);
        } else {
          otherDocumentsContributedTo.add(document._id);
        }

        if (isFirstRevision) {
          documentsCreated.add(document._id);
        }
      }
    }

    const documents = await this.documentStore.getDocumentsMinimalMetadataByIds([...affectedDocumentIds]);

    return {
      contributions: {
        ownDocumentsContributedTo: [...ownDocumentsContributedTo],
        otherDocumentsContributedTo: [...otherDocumentsContributedTo],
        documentsCreated: [...documentsCreated]
      },
      documents
    };
  }
}

export default StatisticsService;
