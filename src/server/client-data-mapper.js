class ClientDataMapper {
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

  dbUserToClientForeignUser(user, includeEmail) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      username: user.username,
      email: includeEmail ? user.email : null
    };
  }

  mapMenuToInitialState({ menu }) {
    return { menu };
  }

  mapDocToInitialState({ doc }) {
    if (!doc) {
      return {
        doc: null,
        sections: null
      };
    }

    return {
      doc: this._mapDocMetadata(doc),
      sections: doc.sections
    };
  }

  mapDocMetadataToInitialState({ docs, allowedUserFields }) {
    return {
      docs: docs.map(doc => ({
        ...doc,
        key: doc._id,
        createdBy: this._mapUser(doc.createdBy, allowedUserFields),
        updatedBy: this._mapUser(doc.updatedBy, allowedUserFields)
      }))
    };
  }

  mapDocHistoryToInitialState({ docs, allowedUserFields }) {
    return {
      docs: docs.map(doc => ({
        ...doc,
        key: doc._id,
        createdBy: this._mapUser(doc.createdBy, allowedUserFields),
        updatedBy: this._mapUser(doc.updatedBy, allowedUserFields),
        sections: doc.sections.map(section => ({
          ...section,
          createdBy: this._mapUser(section.createdBy, allowedUserFields),
          deletedOn: section.deletedOn || null,
          deletedBy: this._mapUser(section.deletedBy, allowedUserFields)
        }))
      }))
    };
  }

  mapDocsMetadataToInitialState({ docs }) {
    return {
      docs: docs.map(doc => this._mapDocMetadata(doc))
    };
  }

  _mapDocMetadata(doc) {
    return {
      key: doc._id,
      title: doc.title,
      slug: doc.slug,
      createdOn: doc.createdOn,
      updatedOn: doc.updatedOn,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy
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

module.exports = ClientDataMapper;
