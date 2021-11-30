import uniqueId from '../utils/unique-id.js';
import privateData from '../domain/private-data.js';
import UserService from '../services/user-service.js';

function isProposableSection(section) {
  return !section.deletedOn
    && !section.deletedBy
    && !section.deletedBecause
    && section.content;
}

class ClientDataMapper {
  static get inject() { return [UserService]; }

  constructor(userService) {
    this.userService = userService;
  }

  dbUserToClientUser(user) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      provider: user.provider,
      username: user.username,
      email: user.email,
      roles: user.roles,
      profile: user.profile
    };
  }

  createProposedSections(documentRevision) {
    return documentRevision.sections.filter(isProposableSection).map(section => ({
      ...section,
      key: uniqueId.create(),
      revision: null
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

  async mapImportBatches(batches, user) {
    const idSet = new Set(batches.map(batch => batch.createdBy));
    const users = await this.userService.getUsersByIds(Array.from(idSet));
    const allowedUserFields = privateData.getAllowedUserFields(user);

    if (users.length !== idSet.size) {
      throw new Error(`Was searching for ${idSet.size} users, but found ${users.length}`);
    }

    const userMap = new Map(users.map(u => [u._id, u]));
    return batches.map(batch => {
      return {
        ...batch,
        createdBy: this._mapUser(userMap.get(batch.createdBy), allowedUserFields)
      };
    });
  }

  async mapImportBatch(batch, user) {
    const users = await this.userService.getUsersByIds([batch.createdBy]);
    const allowedUserFields = privateData.getAllowedUserFields(user);

    if (users.length !== 1) {
      throw new Error(`Was searching for 1 user, but found ${users.length}`);
    }

    return {
      ...batch,
      createdBy: this._mapUser(users[0], allowedUserFields)
    };
  }

  async _getUserMapForDocsOrRevisions(docsOrRevisions) {
    const idSet = this.userService.extractUserIdSetFromDocsOrRevisions(docsOrRevisions);
    const users = await this.userService.getUsersByIds(Array.from(idSet));
    if (users.length !== idSet.size) {
      throw new Error(`Was searching for ${idSet.size} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  _mapDocOrRevision(docOrRevision, userMap, allowedUserFields) {
    const result = {};

    for (const [key, value] of Object.entries(docOrRevision)) {
      switch (key) {
        case 'createdBy':
        case 'updatedBy':
          result[key] = value ? this._mapUser(userMap.get(value), allowedUserFields) : value;
          break;
        case 'contributors':
          result[key] = value.map(c => this._mapUser(userMap.get(c), allowedUserFields));
          break;
        case 'sections':
          result[key] = value.map(s => this._mapSection(s, userMap, allowedUserFields));
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

  _mapSection(section, userMap, allowedUserFields) {
    return {
      ...section,
      deletedBy: section.deletedBy ? this._mapUser(userMap.get(section.deletedBy), allowedUserFields) : section.deletedBy
    };
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
}

export default ClientDataMapper;
