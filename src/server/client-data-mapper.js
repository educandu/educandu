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
      roles: user.roles
    };
  }

  mapMenuToInitialState({ menu }) {
    return { menu };
  }

  mapDocToInitialState({ doc }) {
    return {
      doc: this._mapDocMetadata(doc),
      sections: doc.sections
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
}

module.exports = ClientDataMapper;
