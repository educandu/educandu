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

  async _getUserMapForDocsOrRevisions(docsOrRevisions) {
    const idSet = this._getUserIdSetForDocsOrRevisions(docsOrRevisions);
    const users = await this.userService.getUsersByIds(Array.from(idSet));
    if (users.length !== idSet.size) {
      throw new Error(`Was searching for ${idSet.size} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  _getUserIdSetForDocsOrRevisions(docsOrRevisions) {
    return docsOrRevisions.reduce((set, docOrRev) => this._fillUserIdSetForDocOrRevision(docOrRev, set), new Set());
  }

  _fillUserIdSetForDocOrRevision(docOrRev, set) {
    if (docOrRev.createdBy) {
      set.add(docOrRev.createdBy);
    }
    if (docOrRev.updatedBy) {
      set.add(docOrRev.updatedBy);
    }
    if (docOrRev.contributors) {
      docOrRev.contributors.forEach(c => set.add(c));
    }
    if (docOrRev.sections) {
      docOrRev.sections.forEach(s => {
        if (s.deletedBy) {
          set.add(s.deletedBy);
        }
      });
    }
    return set;
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
