import by from 'thenby';
import RoomStore from '../stores/room-store.js';
import UserStore from '../stores/user-store.js';
import DocumentStore from '../stores/document-store.js';
import { FAVORITE_TYPE, USER_ACTIVITY_TYPE } from '../domain/constants.js';

const completionFunction = Symbol('completion');

class DashboardService {
  static get inject() { return [UserStore, DocumentStore, RoomStore]; }

  constructor(userStore, documentStore, roomStore) {
    this.userStore = userStore;
    this.roomStore = roomStore;
    this.documentStore = documentStore;
  }

  async getUserActivities({ userId, limit = 30 }) {
    const user = await this.userStore.getUserById(userId);

    const createdRooms = await this.roomStore.getLatestRoomsCreatedByUser(userId, { limit });
    const joinedRooms = await this.roomStore.getLatestRoomsJoinedByUser(userId, { limit });
    const updatedRooms = await this.roomStore.getLatestRoomsUpdatedByUser(userId, { limit });
    const createdDocuments = await this.documentStore.getLatestDocumentsMetadataCreatedByUser(userId, { limit });
    const updatedDocuments = await this.documentStore.getLatestDocumentsMetadataUpdatedByUser(userId, { limit });

    const createdDocumentActivities = createdDocuments.map(document => ({
      type: USER_ACTIVITY_TYPE.documentCreated,
      timestamp: document.createdOn,
      data: { _id: document._id, title: document.title },
      isDeprecated: false
    }));

    const updatedDocumentActivities = updatedDocuments.map(document => ({
      type: USER_ACTIVITY_TYPE.documentUpdated,
      timestamp: document.updatedOn,
      data: { _id: document._id, title: document.title },
      isDeprecated: false
    }));

    const createdRoomActivities = createdRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomCreated,
      timestamp: room.createdOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const updatedRoomActivities = updatedRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomUpdated,
      timestamp: room.updatedOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const joinedRoomActivities = joinedRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomJoined,
      timestamp: room.members.find(member => member.userId === userId).joinedOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const latestFavorites = user.favorites.sort(by(f => f.setOn, 'desc')).slice(0, limit);
    const favoriteActivitiesMetadata = latestFavorites.map(favorite => {
      switch (favorite.type) {
        case FAVORITE_TYPE.document:
          return {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const document = await this.documentStore.getDocumentMetadataById(favorite.id);
              return {
                data: { _id: favorite.id, title: document?.title ?? null },
                isDeprecated: !document
              };
            }
          };
        case FAVORITE_TYPE.room:
          return {
            type: USER_ACTIVITY_TYPE.roomMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const room = await this.roomStore.getRoomById(favorite.id);
              return {
                data: { _id: favorite.id, name: room?.name ?? null },
                isDeprecated: !room
              };
            }
          };
        case FAVORITE_TYPE.user:
          return {
            type: USER_ACTIVITY_TYPE.userMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const favoriteUser = await this.userStore.getUserById(favorite.id);
              return {
                data: { _id: favorite.id, displayName: favoriteUser?.displayName ?? null },
                isDeprecated: !favoriteUser
              };
            }
          };
        default:
          return null;
      }
    });

    let incompleteActivities = [
      ...createdDocumentActivities,
      ...updatedDocumentActivities,
      ...createdRoomActivities,
      ...updatedRoomActivities,
      ...joinedRoomActivities,
      ...favoriteActivitiesMetadata
    ]
      .filter(item => item)
      .sort(by(item => item.timestamp, 'desc'));

    if (limit) {
      incompleteActivities = incompleteActivities.slice(0, limit);
    }

    return Promise.all(incompleteActivities.map(async activity => {
      if (activity[completionFunction]) {
        const completionValues = await activity[completionFunction]();
        delete activity[completionFunction];
        Object.assign(activity, completionValues);
      }

      return activity;
    }));
  }
}

export default DashboardService;
