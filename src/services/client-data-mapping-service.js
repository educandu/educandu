import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { ensureIsUnique } from '../utils/array-utils.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { getResourceType } from '../utils/resource-utils.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import DocumentInputStore from '../stores/document-input-store.js';
import { getAccessibleUrl, getPortableUrl } from '../utils/source-utils.js';
import permissions, { getUserPermissions, hasUserPermission } from '../domain/permissions.js';
import { BATCH_TYPE, SEARCH_RESOURCE_TYPE, EVENT_TYPE, FAVORITE_TYPE, TASK_TYPE } from '../domain/constants.js';
import {
  extractUserIdsFromDocsOrRevisions,
  extractUserIdsFromMediaLibraryItems,
  extractUserIdsFromMediaTrashItems,
  extractUserIdsFromRoomMediaItems
} from '../domain/data-extractors.js';

class ClientDataMappingService {
  static dependencies = [ServerConfig, UserStore, StoragePlanStore, RoomStore, DocumentStore, DocumentInputStore, PluginRegistry];

  constructor(serverConfig, userStore, storagePlanStore, roomStore, documentStore, documentInputStore, pluginRegistry) {
    this.serverConfig = serverConfig;
    this.userStore = userStore;
    this.storagePlanStore = storagePlanStore;
    this.roomStore = roomStore;
    this.documentStore = documentStore;
    this.documentInputStore = documentInputStore;
    this.pluginRegistry = pluginRegistry;
  }

  mapWebsitePublicUser({ viewedUser, viewingUser }) {
    if (!viewedUser) {
      return null;
    }

    const mappedViewedUser = {
      _id: viewedUser._id,
      displayName: viewedUser.displayName,
      organization: viewedUser.organization,
      profileOverview: viewedUser.profileOverview,
      shortDescription: viewedUser.shortDescription,
      avatarUrl: urlUtils.getGravatarUrl(viewedUser.accountClosedOn ? null : viewedUser.email),
      allowContactRequestEmails: viewedUser.allowContactRequestEmails,
      accountClosedOn: viewedUser.accountClosedOn ? viewedUser.accountClosedOn.toISOString() : null,
    };

    if (hasUserPermission(viewingUser, permissions.MANAGE_USERS)) {
      mappedViewedUser.email = viewedUser.email;
    }

    return mappedViewedUser;
  }

  mapWebsiteUser(user) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      organization: user.organization,
      profileOverview: user.profileOverview,
      shortDescription: user.shortDescription,
      favorites: user.favorites.map(favorite => ({
        ...favorite,
        setOn: favorite.setOn.toISOString()
      })),
      dashboardSettings: user.dashboardSettings,
      emailNotificationFrequency: user.emailNotificationFrequency,
      allowContactRequestEmails: user.allowContactRequestEmails
    };
  }

  mapUserForAdminArea(user) {
    return {
      ...user,
      expiresOn: user.expiresOn ? user.expiresOn.toISOString() : user.expiresOn,
      accountLockedOn: user.accountLockedOn ? user.accountLockedOn.toISOString() : user.accountLockedOn,
      accountClosedOn: user.accountClosedOn ? user.accountClosedOn.toISOString() : user.accountClosedOn,
      lastLoggedInOn: user.lastLoggedInOn ? user.lastLoggedInOn.toISOString() : user.lastLoggedInOn,
      storage: {
        ...user.storage,
        reminders: user.storage.reminders.map(reminder => ({
          ...reminder,
          timestamp: reminder.timestamp.toISOString()
        }))
      },
      favorites: user.favorites.map(favorite => ({
        ...favorite,
        setOn: favorite.setOn.toISOString()
      }))
    };
  }

  mapUsersForAdminArea(users) {
    return users.map(this.mapUserForAdminArea);
  }

  mapExternalAccountForAdminArea(externalAccount) {
    return externalAccount;
  }

  mapExternalAccountsForAdminArea(externalAccounts) {
    return externalAccounts.map(this.mapExternalAccountForAdminArea);
  }

  createProposedSections(docOrRevision, targetRoomId) {
    return docOrRevision.sections.reduce((proposedSections, section) => {
      if (!this._isDeletedSection(section)) {
        const plugin = this.pluginRegistry.getRegisteredPlugin(section.type);
        const redactedContent = plugin?.info.redactContent?.(section.content, targetRoomId) || null;
        if (redactedContent) {
          proposedSections.push({
            ...section,
            key: uniqueId.create(),
            revision: null,
            content: redactedContent
          });
        }
      }

      return proposedSections;
    }, []);
  }

  async mapDocOrRevision(docOrRevision, user) {
    const grantedPermissions = getUserPermissions(user);
    const userMap = await this._getUserMapForDocsOrRevisions([docOrRevision]);

    return this._mapDocOrRevision(docOrRevision, userMap, grantedPermissions);
  }

  async mapDocsOrRevisions(docsOrRevisions, user) {
    const grantedPermissions = getUserPermissions(user);
    const userMap = await this._getUserMapForDocsOrRevisions(docsOrRevisions.filter(x => !!x));

    return docsOrRevisions.map(docOrRevision => {
      return docOrRevision
        ? this._mapDocOrRevision(docOrRevision, userMap, grantedPermissions)
        : docOrRevision;
    });
  }

  mapUserContributionsData(userContributions, user) {
    const grantedPermissions = getUserPermissions(user);
    return userContributions.map(userContribution => ({
      ...userContribution,
      user: this._mapOtherUser({ user: userContribution.user, grantedPermissions })
    }));
  }

  mapSearchableResults({ documents, documentRatings, mediaLibraryItems }) {
    const mappedDocuments = documents.map(document => {
      const documentRating = documentRatings.find(rating => rating.documentId === document._id);

      if (!documentRating) {
        throw new Error(`Document rating missing for document with _id ${document._id}.`);
      }

      return {
        _id: document._id,
        tags: document.tags,
        slug: document.slug,
        title: document.title,
        searchResourceType: SEARCH_RESOURCE_TYPE.document,
        relevance: document.relevance,
        shortDescription: document.shortDescription,
        createdOn: document.createdOn.toISOString(),
        updatedOn: document.updatedOn.toISOString(),
        rating: {
          ratingsCount: documentRating.ratingsCount,
          ratingsCountPerValue: documentRating.ratingsCountPerValue,
          averageRatingValue: documentRating.averageRatingValue
        },
        verified: !!document.publicContext?.verified
      };
    });

    const mappedMediaLibraryItems = mediaLibraryItems.map(mediaLibraryItem => {
      const resourceType = getResourceType(mediaLibraryItem.url);

      return {
        _id: mediaLibraryItem._id,
        tags: mediaLibraryItem.tags,
        slug: null,
        title: urlUtils.getFileName(mediaLibraryItem.url),
        searchResourceType: resourceType,
        relevance: mediaLibraryItem.relevance,
        shortDescription: mediaLibraryItem.shortDescription,
        createdOn: mediaLibraryItem.createdOn.toISOString(),
        updatedOn: mediaLibraryItem.updatedOn.toISOString(),
        rating: null,
        verified: false
      };
    });

    return [...mappedDocuments, ...mappedMediaLibraryItems];
  }

  async mapMediaLibraryItem(mediaLibraryItem, user) {
    const grantedPermissions = getUserPermissions(user);
    const userMap = await this._getUserMapForMediaLibraryItems([mediaLibraryItem]);

    return this._mapMediaLibraryItem(mediaLibraryItem, userMap, grantedPermissions);
  }

  async mapMediaLibraryItems(mediaLibraryItems, user) {
    const grantedPermissions = getUserPermissions(user);
    const userMap = await this._getUserMapForMediaLibraryItems(mediaLibraryItems.filter(x => !!x));

    return mediaLibraryItems.map(mediaLibraryItem => {
      return mediaLibraryItem
        ? this._mapMediaLibraryItem(mediaLibraryItem, userMap, grantedPermissions)
        : mediaLibraryItem;
    });
  }

  async mapMediaTrashItems(mediaTrashItems, user) {
    const grantedPermissions = getUserPermissions(user);
    const userMap = await this._getUserMapForMediaTrashItems(mediaTrashItems.filter(x => !!x));

    return mediaTrashItems.map(mediaTrashItem => {
      return mediaTrashItem
        ? this._mapMediaTrashItem(mediaTrashItem, userMap, grantedPermissions)
        : mediaTrashItem;
    });
  }

  async mapSingleRoomMediaOverview(singleRoomMediaOverview, user) {
    const grantedPermissions = getUserPermissions(user);
    const mappedSingleRoomMediaOverview = cloneDeep(singleRoomMediaOverview);

    const { roomMediaItems } = mappedSingleRoomMediaOverview.roomStorage;
    const userMap = await this._getUserMapForRoomMediaItems(roomMediaItems.filter(x => !!x));

    const mappedRoomMediaItems = roomMediaItems.map(roomMediaItem => this._mapRoomMediaItem(roomMediaItem, userMap, grantedPermissions));
    mappedSingleRoomMediaOverview.roomStorage.roomMediaItems = mappedRoomMediaItems;

    return mappedSingleRoomMediaOverview;
  }

  async mapAllRoomMediaOverview(allRoomMediaOverview, user) {
    const grantedPermissions = getUserPermissions(user);
    const mappedAllRoomMediaOverview = cloneDeep(allRoomMediaOverview);

    const allRoomMediaItems = mappedAllRoomMediaOverview.roomStorageList.map(storage => storage.roomMediaItems).flat();
    const userMap = await this._getUserMapForRoomMediaItems(allRoomMediaItems.filter(x => !!x));

    mappedAllRoomMediaOverview.roomStorageList.forEach(storage => {
      const mappedRoomMediaItems = storage.roomMediaItems.map(roomMediaItem => this._mapRoomMediaItem(roomMediaItem, userMap, grantedPermissions));
      storage.roomMediaItems = mappedRoomMediaItems;
    });

    return mappedAllRoomMediaOverview;
  }

  async mapDocumentRequestCounters({ documentRequestCounters }) {
    const documentIds = documentRequestCounters.map(counter => counter.documentId);
    const documents = await this.documentStore.getDocumentsMetadataByIds(documentIds);

    const mappedDocumentsWithRequestCounters = documentRequestCounters.map(counter => {
      const document = documents.find(doc => doc._id === counter.documentId);

      return {
        _id: counter.documentId,
        slug: document.slug,
        title: document.title,
        totalCount: counter.totalCount,
        readCount: counter.readCount,
        writeCount: counter.writeCount,
        anonymousCount: counter.anonymousCount,
        loggedInCount: counter.loggedInCount
      };
    });

    return mappedDocumentsWithRequestCounters;
  }

  _mapNotificationEventParams(eventType, eventParams, allowedDocumentsById, allowedRoomsById, allowedDocumentInputsById) {
    switch (eventType) {
      case EVENT_TYPE.documentRevisionCreated:
      case EVENT_TYPE.documentCommentCreated:
        return {
          document: allowedDocumentsById.get(eventParams.documentId) || null
        };
      case EVENT_TYPE.roomMessageCreated:
        return {
          room: allowedRoomsById.get(eventParams.roomId) || null
        };
      case EVENT_TYPE.documentInputCreated:
      case EVENT_TYPE.documentInputCommentCreated:
        return {
          documentInput: allowedDocumentInputsById.get(eventParams.documentInputId) || null,
          document: allowedDocumentsById.get(eventParams.documentId) || null,
          room: allowedRoomsById.get(eventParams.roomId) || null
        };
      default:
        throw new Error(`Unsupported event type '${eventType}'`);
    }
  }

  async mapUserNotificationGroups(notificationGroups, user) {
    const occurringDocumentIds = [...new Set(notificationGroups.map(g => g.eventParams.documentId).filter(x => x))];
    const occuringDocumentInputIds = [...new Set(notificationGroups.map(g => g.eventParams.documentInputId).filter(x => x))];

    const [occurringDocuments, occurringDocumentInputs, allowedRooms] = await Promise.all([
      this.documentStore.getDocumentsMetadataByIds(occurringDocumentIds),
      this.documentInputStore.getDocumentInputsByIds(occuringDocumentInputIds),
      this.roomStore.getRoomsOwnedOrJoinedByUser(user._id)
    ]);

    const allowedRoomsById = allowedRooms.reduce((map, item) => {
      map.set(item._id, item);
      return map;
    }, new Map());

    const allowedDocumentsById = occurringDocuments.reduce((map, item) => {
      const isPublicDocument = !item.roomId;
      const isUserAccessibleRoomDocument = !!item.roomId && allowedRoomsById.has(item.roomId);
      if (isPublicDocument || isUserAccessibleRoomDocument) {
        map.set(item._id, item);
      }
      return map;
    }, new Map());

    const allowedDocumentInputsById = occurringDocumentInputs.reduce((map, item) => {
      const isOwnSubmittedDocumentInput = item.createdBy === user._id;
      const document = occurringDocuments.find(doc => doc._id === item.documentId);
      const room = allowedRooms.find(r => r._id === document?.roomId);

      const isOwnerOrCollaborator = !!room && (room.ownedBy === user._id || room.isCollaborative);
      if (isOwnSubmittedDocumentInput || isOwnerOrCollaborator) {
        map.set(item._id, item);
      }
      return map;
    }, new Map());

    return notificationGroups.map(group => ({
      notificationIds: group.notificationIds,
      eventType: group.eventType,
      eventParams: this._mapNotificationEventParams(group.eventType, group.eventParams, allowedDocumentsById, allowedRoomsById, allowedDocumentInputsById),
      firstCreatedOn: group.firstCreatedOn.toISOString(),
      lastCreatedOn: group.lastCreatedOn.toISOString()
    }));
  }

  async mapBatches(batches, user) {
    const grantedPermissions = getUserPermissions(user);
    const userIdSet = new Set(batches.map(batch => batch.createdBy));
    const users = await this.userStore.getUsersByIds(Array.from(userIdSet));

    if (users.length !== userIdSet.size) {
      throw new Error(`Was searching for ${userIdSet.size} users, but found ${users.length}`);
    }

    const userMap = new Map(users.map(u => [u._id, u]));
    return batches.map(batch => this._mapBatch(batch, userMap.get(batch.createdBy), grantedPermissions));
  }

  async mapBatch(batch, user) {
    const mappedBatches = await this.mapBatches([batch], user);
    return mappedBatches[0];
  }

  async mapUserOwnRoomInvitations(invitation) {
    const room = await this.roomStore.getRoomById(invitation.roomId);
    const ownerUser = await this.userStore.getUserById(room.ownedBy);

    return {
      _id: invitation._id,
      token: invitation.token,
      sentOn: invitation.sentOn.toISOString(),
      expiresOn: invitation.expiresOn.toISOString(),
      room: {
        _id: room._id,
        name: room.name,
        shortDescription: room.shortDescription,
        isCollaborative: room.isCollaborative,
        ownedBy: room.ownedBy,
        owner: {
          _id: ownerUser._id,
          displayName: ownerUser.displayName
        }
      }
    };
  }

  async mapRoom({ room, viewingUser }) {
    const mappedRoom = cloneDeep(room);
    const grantedPermissions = getUserPermissions(viewingUser);
    const viewingUserIsRoomOwner = viewingUser?._id === room.ownedBy;

    const ownerUser = await this.userStore.getUserById(room.ownedBy);
    mappedRoom.owner = this._mapOtherUser({ user: ownerUser, grantedPermissions });

    const memberUsers = await this.userStore.getUsersByIds(room.members.map(member => member.userId));

    mappedRoom.members = room.members.reduce((existingMemberUsers, member) => {
      const memberUser = memberUsers.find(m => member.userId === m._id);

      if (memberUser) {
        const memberUserProfileData = this.mapWebsitePublicUser({ viewedUser: memberUser, viewingUser });
        const memberEmail = viewingUserIsRoomOwner ? memberUser.email : memberUserProfileData.email || null;

        const mappedMemberUser = {
          userId: member.userId,
          joinedOn: member.joinedOn?.toISOString() || null,
          displayName: memberUserProfileData.displayName,
          shortDescription: memberUserProfileData.shortDescription,
          organization: memberUserProfileData.organization,
          avatarUrl: memberUserProfileData.avatarUrl
        };
        if (memberEmail) {
          mappedMemberUser.email = memberEmail;
        }
        existingMemberUsers.push(mappedMemberUser);
      }

      return existingMemberUsers;
    }, []);

    mappedRoom.messages = room.messages.map(message => ({
      ...message,
      createdOn: message.createdOn.toISOString()
    }));

    return {
      ...mappedRoom,
      createdOn: mappedRoom.createdOn.toISOString(),
      updatedOn: mappedRoom.updatedOn.toISOString()
    };
  }

  mapRoomInvitations(invitations) {
    return invitations.map(invitation => this._mapRoomInvitation(invitation));
  }

  mapSamlIdentityProvider(provider) {
    return {
      key: provider.key,
      displayName: provider.displayName,
      logoUrl: provider.logoUrl || null
    };
  }

  mapUserActivities(activities) {
    return activities.map(activity => ({ ...activity, timestamp: activity.timestamp.toISOString() }));
  }

  async mapUserFavorites(favorites, user) {
    const mappedUserFavorites = [];

    for (const favorite of favorites) {
      mappedUserFavorites.push(await this._mapFavorite({ favorite, user }));
    }

    return mappedUserFavorites;
  }

  async mapDocumentComment(comment) {
    const userMap = await this._getUserMapForComments([comment]);
    return this._mapDocumentComment(comment, userMap);
  }

  async mapDocumentComments(comments) {
    const userMap = await this._getUserMapForComments(comments);
    return comments.map(comment => this._mapDocumentComment(comment, userMap));
  }

  async mapDocumentCategory(documentCategory, { includeMappedDocuments } = {}) {
    const userMap = await this._getUserMapForDocumentCategories([documentCategory]);
    const documentMap = includeMappedDocuments ? await this._getDocumentMapForDocumentCategories([documentCategory]) : null;
    return this._mapDocumentCategory({ documentCategory, userMap, documentMap });
  }

  async mapDocumentCategories(documentCategories, { includeMappedDocuments } = {}) {
    const userMap = await this._getUserMapForDocumentCategories(documentCategories);
    const documentMap = includeMappedDocuments ? await this._getDocumentMapForDocumentCategories(documentCategories) : null;
    return documentCategories.map(documentCategory => this._mapDocumentCategory({ documentCategory, userMap, documentMap }));
  }

  async mapDocumentInput({ documentInput, document }) {
    const userMap = await this._getUserMapForDocumentInputs([documentInput]);
    return this._mapDocumentInput({ documentInput, document, userMap });
  }

  async mapDocumentInputs({ documentInputs, documents }) {
    const userMap = await this._getUserMapForDocumentInputs(documentInputs);
    return documentInputs.map(documentInput => {
      const document = documents.find(doc => doc._id === documentInput.documentId);
      return this._mapDocumentInput({ documentInput, document, userMap });
    });
  }

  async _mapFavorite({ favorite, user }) {
    const mappedFavorite = {
      ...favorite,
      setOn: favorite.setOn.toISOString()
    };

    switch (favorite.type) {
      case FAVORITE_TYPE.user:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapWebsitePublicUser({ viewedUser: favorite.data, viewingUser: user }) : null
        };
      case FAVORITE_TYPE.room:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapRoom({ room: favorite.data, viewingUser: user }) : null
        };
      case FAVORITE_TYPE.document:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapDocOrRevision(favorite.data, user) : null
        };
      default:
        return mappedFavorite;
    }
  }

  _mapDocumentComment(comment, userMap) {
    const mappedComment = cloneDeep(comment);
    const createdBy = this._mapOtherUser({ user: userMap.get(comment.createdBy) });
    const deletedBy = this._mapOtherUser({ user: userMap.get(comment.deletedBy) });

    return {
      ...mappedComment,
      createdBy,
      deletedBy,
      createdOn: mappedComment.createdOn.toISOString(),
      deletedOn: mappedComment.deletedOn && mappedComment.deletedOn.toISOString()
    };
  }

  _mapDocumentCategory({ documentCategory, userMap, documentMap }) {
    const mappedDocumentCategory = {
      _id: documentCategory._id,
      name: documentCategory.name,
      iconUrl: documentCategory.iconUrl,
      description: documentCategory.description,
      documentIds: [...documentCategory.documentIds],
      createdOn: documentCategory.createdOn.toISOString(),
      updatedOn: documentCategory.updatedOn.toISOString(),
      createdBy: this._mapOtherUser({ user: userMap.get(documentCategory.createdBy) }),
      updatedBy: this._mapOtherUser({ user: userMap.get(documentCategory.updatedBy) })
    };

    if (documentMap) {
      mappedDocumentCategory.documents = documentCategory.documentIds.map(documentId => {
        const document = documentMap.get(documentId).title;
        return {
          _id: documentId,
          slug: document.slug,
          title: documentMap.get(documentId).title
        };
      });
    }

    return mappedDocumentCategory;
  }

  _mapOtherUser({ user, grantedPermissions = [] }) {
    if (!user) {
      return null;
    }

    const mappedUser = {
      _id: user._id,
      displayName: user.displayName
    };

    if (grantedPermissions.includes(permissions.MANAGE_USERS)) {
      mappedUser.email = user.email;
    }

    return mappedUser;
  }

  _mapTaskParams(rawTaskParams, taskType) {
    switch (taskType) {
      case TASK_TYPE.documentValidation:
      case TASK_TYPE.documentRegeneration:
      case TASK_TYPE.cdnResourcesConsolidation:
        return {
          ...rawTaskParams
        };
      default:
        throw new Error(`Task param mapping for task type ${taskType} is not implemented`);
    }
  }

  _mapTaskAttempt(rawTaskAttempt) {
    const startedOn = rawTaskAttempt.startedOn && rawTaskAttempt.startedOn.toISOString();
    const completedOn = rawTaskAttempt.completedOn && rawTaskAttempt.completedOn.toISOString();

    return {
      ...rawTaskAttempt,
      startedOn,
      completedOn
    };
  }

  _mapTask(rawTask) {
    const taskParams = rawTask.taskParams && this._mapTaskParams(rawTask.taskParams, rawTask.taskType);
    const attempts = rawTask.attempts && rawTask.attempts.map(attempt => this._mapTaskAttempt(attempt));

    return {
      ...rawTask,
      taskParams,
      attempts
    };
  }

  _mapBatchParams(rawBatchParams, batchType) {
    switch (batchType) {
      case BATCH_TYPE.documentValidation:
      case BATCH_TYPE.documentRegeneration:
      case BATCH_TYPE.cdnResourcesConsolidation:
        return {
          ...rawBatchParams
        };
      default:
        throw new Error(`Batch param mapping for batch type ${batchType} is not implemented`);
    }
  }

  _mapBatch(rawBatch, rawUser, grantedPermissions) {
    const createdOn = rawBatch.createdOn && rawBatch.createdOn.toISOString();
    const completedOn = rawBatch.completedOn && rawBatch.completedOn.toISOString();
    const createdBy = this._mapOtherUser({ user: rawUser, grantedPermissions });
    const batchParams = this._mapBatchParams(rawBatch.batchParams, rawBatch.batchType);
    const tasks = rawBatch.tasks && rawBatch.tasks.map(task => this._mapTask(task));

    return {
      ...rawBatch,
      createdOn,
      completedOn,
      createdBy,
      batchParams,
      tasks
    };
  }

  _mapRoomInvitation(rawInvitation) {
    const sentOn = rawInvitation.sentOn && rawInvitation.sentOn.toISOString();
    const expiresOn = rawInvitation.expiresOn && rawInvitation.expiresOn.toISOString();

    return {
      ...rawInvitation,
      sentOn,
      expiresOn
    };
  }

  _mapMediaLibraryItem(mediaLibraryItem, userMap, grantedPermissions) {
    if (!mediaLibraryItem) {
      return mediaLibraryItem;
    }

    const result = {};

    for (const [key, value] of Object.entries(mediaLibraryItem)) {
      switch (key) {
        case 'url':
          result.url = getAccessibleUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          result.portableUrl = getPortableUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          break;
        case 'createdOn':
        case 'updatedOn':
          result[key] = value ? value.toISOString() : value;
          break;
        case 'createdBy':
        case 'updatedBy':
          result[key] = value ? this._mapOtherUser({ user: userMap.get(value), grantedPermissions }) : value;
          break;
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _mapMediaTrashItem(mediaTrashItem, userMap, grantedPermissions) {
    if (!mediaTrashItem) {
      return mediaTrashItem;
    }

    const result = {};

    for (const [key, value] of Object.entries(mediaTrashItem)) {
      switch (key) {
        case 'url':
          result.url = getAccessibleUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          result.portableUrl = getPortableUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          break;
        case 'createdOn':
          result[key] = value ? value.toISOString() : value;
          break;
        case 'createdBy':
          result[key] = value ? this._mapOtherUser({ user: userMap.get(value), grantedPermissions }) : value;
          break;
        case 'originalItem':
          result[key] = value ? this._mapMediaLibraryItem(value, userMap, grantedPermissions) : value;
          break;
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _mapRoomMediaItem(roomMediaItem, userMap, grantedPermissions) {
    if (!roomMediaItem) {
      return roomMediaItem;
    }

    const result = {};

    for (const [key, value] of Object.entries(roomMediaItem)) {
      switch (key) {
        case 'url':
          result.url = getAccessibleUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          result.portableUrl = getPortableUrl({ url: value, cdnRootUrl: this.serverConfig.cdnRootUrl });
          break;
        case 'createdOn':
          result[key] = value ? value.toISOString() : value;
          break;
        case 'createdBy':
          result[key] = value ? this._mapOtherUser({ user: userMap.get(value), grantedPermissions }) : value;
          break;
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _mapDocumentSection(section, userMap, grantedPermissions) {
    return {
      ...section,
      deletedOn: section.deletedOn ? section.deletedOn.toISOString() : section.deletedOn,
      deletedBy: section.deletedBy ? this._mapOtherUser({ user: userMap.get(section.deletedBy), grantedPermissions }) : section.deletedBy
    };
  }

  _mapDocOrRevision(docOrRevision, userMap, grantedPermissions) {
    if (!docOrRevision) {
      return docOrRevision;
    }

    const result = {};

    for (const [key, value] of Object.entries(docOrRevision)) {
      switch (key) {
        case 'createdOn':
        case 'updatedOn':
          result[key] = value ? value.toISOString() : value;
          break;
        case 'createdBy':
        case 'updatedBy':
          result[key] = value ? this._mapOtherUser({ user: userMap.get(value), grantedPermissions }) : value;
          break;
        case 'contributors':
          result[key] = value.map(c => this._mapOtherUser({ user: userMap.get(c), grantedPermissions }));
          break;
        case 'sections':
          result[key] = value.map(s => this._mapDocumentSection(s, userMap, grantedPermissions));
          break;
        case 'publicContext':
          result[key] = value
            ? {
              ...value,
              allowedEditors: value.allowedEditors.map(c => this._mapOtherUser({ user: userMap.get(c), grantedPermissions }))
            }
            : value;
          break;
        case 'cdnResources':
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _mapDocumentInput({ documentInput, document, userMap }) {
    const mappedDocumentInput = cloneDeep(documentInput);
    const createdBy = this._mapOtherUser({ user: userMap.get(documentInput.createdBy) });
    const updatedBy = this._mapOtherUser({ user: userMap.get(documentInput.updatedBy) });

    Object.values(mappedDocumentInput.sections).forEach(section => {
      section.comments.forEach(comment => {
        comment.createdOn = comment.createdOn.toISOString();
        comment.createdBy = this._mapOtherUser({ user: userMap.get(comment.createdBy) });
        comment.deletedOn = comment.deletedOn ? comment.deletedOn.toISOString() : '';
        comment.deletedBy = this._mapOtherUser({ user: userMap.get(comment.deletedBy) });
      });
    });

    return {
      ...mappedDocumentInput,
      documentTitle: document?.title,
      createdBy,
      updatedBy,
      createdOn: mappedDocumentInput.createdOn.toISOString(),
      updatedOn: mappedDocumentInput.updatedOn && mappedDocumentInput.updatedOn.toISOString()
    };
  }

  _isDeletedSection(section) {
    return section.deletedOn
      || section.deletedBy
      || section.deletedBecause
      || !section.content;
  }

  async _getUserMapForDocsOrRevisions(docsOrRevisions) {
    const userIds = extractUserIdsFromDocsOrRevisions(docsOrRevisions);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForComments(comments) {
    const createdByUserIds = comments.map(comment => comment.createdBy).filter(comment => comment);
    const deletedByUserIds = comments.map(comment => comment.deletedBy).filter(comment => comment);

    const userIds = [...new Set([...createdByUserIds, ...deletedByUserIds])];
    const users = await this.userStore.getUsersByIds(userIds);

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForMediaLibraryItems(mediaLibraryItems) {
    const userIds = extractUserIdsFromMediaLibraryItems(mediaLibraryItems);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForMediaTrashItems(mediaTrashItems) {
    const userIds = extractUserIdsFromMediaTrashItems(mediaTrashItems);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForRoomMediaItems(roomMediaItems) {
    const userIds = extractUserIdsFromRoomMediaItems(roomMediaItems);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForDocumentInputs(documentInputs) {
    const createdByUserIds = documentInputs.map(input => input.createdBy);
    const updatedByUserIds = documentInputs.map(input => input.updatedBy);

    const sectionsData = documentInputs.flatMap(documentInput => Object.values(documentInput.sections));
    const commentsData = sectionsData.flatMap(sectionData => sectionData.comments);
    const commentsCreatedByUserIds = commentsData.map(commentData => commentData.createdBy);
    const commentsDeletedByUserIds = commentsData.map(commentData => commentData.deletedBy).filter(x => x);

    const userIds = [...new Set([...createdByUserIds, ...updatedByUserIds, ...commentsCreatedByUserIds, ...commentsDeletedByUserIds])];
    const users = await this.userStore.getUsersByIds(userIds);

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForDocumentCategories(documentCategories) {
    const createdByUserIds = documentCategories.map(documentCategory => documentCategory.createdBy);
    const updatedByUserIds = documentCategories.map(documentCategory => documentCategory.updatedBy);

    const userIds = [...new Set([...createdByUserIds, ...updatedByUserIds])];
    const users = await this.userStore.getUsersByIds(userIds);

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getDocumentMapForDocumentCategories(documentCategories) {
    const documentIds = ensureIsUnique(documentCategories.flatMap(documentCategory => documentCategory.documentIds));
    const documents = await this.documentStore.getDocumentsMetadataByIds(documentIds);

    if (documents.length !== documentIds.length) {
      throw new Error(`Was searching for ${documentIds.length} documents, but found ${documents.length}`);
    }

    return new Map(documents.map(d => [d._id, d]));
  }
}

export default ClientDataMappingService;
