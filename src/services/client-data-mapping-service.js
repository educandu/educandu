import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import UserStore from '../stores/user-store.js';
import privateData from '../domain/private-data.js';
import { BATCH_TYPE, TASK_TYPE } from '../domain/constants.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

class ClientDataMappingService {
  static get inject() { return [UserStore]; }

  constructor(userStore) {
    this.userStore = userStore;
  }

  mapWebsiteUser(user) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      provider: user.provider,
      username: user.username,
      email: user.email,
      roles: user.roles,
      profile: user.profile,
      storage: {
        plan: user.storage.plan,
        usedBytes: user.storage.usedBytes
      },
      favorites: user.favorites.map(favorite => ({
        ...favorite,
        setOn: favorite.setOn.toISOString()
      }))
    };
  }

  mapUsersForAdminArea(users) {
    return users.map(user => ({
      ...user,
      expires: user.expires ? user.expires.toISOString() : user.expires,
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
    }));
  }

  createProposedSections(documentRevision) {
    return documentRevision.sections.filter(this._isProposableSection).map(section => ({
      ...section,
      key: uniqueId.create(),
      revision: null
    }));
  }

  createProposedLessonSections(lesson) {
    return lesson.sections.map(section => ({
      ...section,
      key: uniqueId.create()
    }));
  }

  async mapDocOrRevision(docOrRevision, user) {
    const userMap = await this._getUserMapForDocsOrRevisions([docOrRevision]);
    const allowedUserFields = privateData.getAllowedUserFields(user);
    return this._mapDocOrRevision(docOrRevision, userMap, allowedUserFields);
  }

  async mapDocsOrRevisions(docsOrRevisions, user) {
    const userMap = await this._getUserMapForDocsOrRevisions(docsOrRevisions.filter(x => !!x));
    const allowedUserFields = privateData.getAllowedUserFields(user);
    return docsOrRevisions.map(docOrRevision => {
      return docOrRevision
        ? this._mapDocOrRevision(docOrRevision, userMap, allowedUserFields)
        : docOrRevision;
    });
  }

  async mapBatches(batches, user) {
    const userIdSet = new Set(batches.map(batch => batch.createdBy));
    const users = await this.userStore.getUsersByIds(Array.from(userIdSet));
    const allowedUserFields = privateData.getAllowedUserFields(user);

    if (users.length !== userIdSet.size) {
      throw new Error(`Was searching for ${userIdSet.size} users, but found ${users.length}`);
    }

    const userMap = new Map(users.map(u => [u._id, u]));
    return batches.map(batch => this._mapBatch(batch, userMap.get(batch.createdBy), allowedUserFields));
  }

  async mapBatch(batch, user) {
    const mappedBatches = await this.mapBatches([batch], user);
    return mappedBatches[0];
  }

  async mapRoom(room, user) {
    const allowedUserFields = privateData.getAllowedUserFields(user);
    const mappedRoom = cloneDeep(room);

    const owner = await this.userStore.getUserById(room.owner);
    mappedRoom.owner = this._mapUser(owner, allowedUserFields);

    const memberUsers = await this.userStore.getUsersByIds(room.members.map(member => member.userId));

    mappedRoom.members = room.members.map(member => {
      const memberDetails = memberUsers.find(memberUser => member.userId === memberUser._id);
      return {
        userId: member.userId,
        joinedOn: member.joinedOn && member.joinedOn.toISOString(),
        username: memberDetails.username
      };
    });

    return mappedRoom;
  }

  mapRoomInvitations(invitations) {
    return invitations.map(invitation => this._mapRoomInvitation(invitation));
  }

  mapLesson(lesson) {
    return this._mapLesson(lesson);
  }

  mapLessonsMetadata(lessons) {
    return lessons.map(lesson => this._mapLessonMetadata(lesson));
  }

  mapUserActivities(activities) {
    return activities.map(activity => ({ ...activity, timestamp: activity.timestamp.toISOString() }));
  }

  mapUserFavorites(favorites) {
    return favorites.map(favorite => ({
      id: favorite.id,
      type: favorite.type,
      setOn: favorite.setOn.toISOString(),
      title: favorite.title || ''
    }));
  }

  _mapUser(user, allowedUserFields) {
    if (!user) {
      return null;
    }

    const mappedUser = {};
    for (const field of allowedUserFields) {
      if (field in user) {
        mappedUser[field] = user[field];
        if (field === '_id') {
          mappedUser.key = user._id;
        }
      }
    }

    return mappedUser;
  }

  _mapTaskParams(rawTaskParams, taskType) {
    switch (taskType) {
      case TASK_TYPE.documentImport:
        return {
          ...rawTaskParams,
          updatedOn: rawTaskParams.updatedOn && rawTaskParams.updatedOn.toISOString()
        };
      case TASK_TYPE.documentRegeneration:
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
      case BATCH_TYPE.documentImport:
      case BATCH_TYPE.documentRegeneration:
        return {
          ...rawBatchParams
        };
      default:
        throw new Error(`Batch param mapping for batch type ${batchType} is not implemented`);
    }
  }

  _mapBatch(rawBatch, rawUser, allowedUserFields) {
    const createdOn = rawBatch.createdOn && rawBatch.createdOn.toISOString();
    const completedOn = rawBatch.completedOn && rawBatch.completedOn.toISOString();
    const createdBy = this._mapUser(rawUser, allowedUserFields);
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
    const expires = rawInvitation.expires && rawInvitation.expires.toISOString();

    return {
      ...rawInvitation,
      sentOn,
      expires
    };
  }

  _mapLessonSchedule(rawSchedule) {
    const startsOn = rawSchedule.startsOn && rawSchedule.startsOn.toISOString();

    return {
      ...rawSchedule,
      startsOn
    };
  }

  _mapLessonMetadata(rawLesson) {
    const createdOn = rawLesson.createdOn && rawLesson.createdOn.toISOString();
    const updatedOn = rawLesson.updatedOn && rawLesson.updatedOn.toISOString();
    const schedule = rawLesson.schedule && this._mapLessonSchedule(rawLesson.schedule);

    return {
      ...rawLesson,
      createdOn,
      updatedOn,
      schedule
    };
  }

  _mapLesson(rawLesson) {
    const sections = rawLesson.sections.map(section => this._mapLessonSection(section));

    return {
      ...rawLesson,
      ...this._mapLessonMetadata(rawLesson),
      sections
    };
  }

  _mapLessonSection(section) {
    return {
      key: section.key,
      type: section.type,
      content: section.content
    };
  }

  _mapDocumentSection(section, userMap, allowedUserFields) {
    return {
      ...section,
      deletedOn: section.deletedOn ? section.deletedOn.toISOString() : section.deletedOn,
      deletedBy: section.deletedBy ? this._mapUser(userMap.get(section.deletedBy), allowedUserFields) : section.deletedBy
    };
  }

  _mapDocOrRevision(docOrRevision, userMap, allowedUserFields) {
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
          result[key] = value ? this._mapUser(userMap.get(value), allowedUserFields) : value;
          break;
        case 'contributors':
          result[key] = value.map(c => this._mapUser(userMap.get(c), allowedUserFields));
          break;
        case 'sections':
          result[key] = value.map(s => this._mapDocumentSection(s, userMap, allowedUserFields));
          break;
        case 'cdnResources':
          break;
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _isProposableSection(section) {
    return !section.deletedOn
      && !section.deletedBy
      && !section.deletedBecause
      && section.content;
  }

  async _getUserMapForDocsOrRevisions(docsOrRevisions) {
    const userIds = extractUserIdsFromDocsOrRevisions(docsOrRevisions);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }
}

export default ClientDataMappingService;
