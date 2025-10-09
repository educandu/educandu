const fillUserIdSetForDocOrRevision = (docOrRev, set) => {
  if (docOrRev.createdBy) {
    set.add(docOrRev.createdBy);
  }
  if (docOrRev.updatedBy) {
    set.add(docOrRev.updatedBy);
  }
  if (docOrRev.contributors) {
    docOrRev.contributors.forEach(contributor => set.add(contributor));
  }
  if (docOrRev.sections) {
    docOrRev.sections.forEach(section => {
      if (section.deletedBy) {
        set.add(section.deletedBy);
      }
    });
  }
  if (docOrRev.publicContext) {
    docOrRev.publicContext.allowedEditors.forEach(allowedEditor => set.add(allowedEditor));
  }
  return set;
};

export const extractUserIdsFromDocsOrRevisions = docsOrRevisions => {
  const idsSet = docsOrRevisions.reduce((set, docOrRev) => fillUserIdSetForDocOrRevision(docOrRev, set), new Set());
  return [...idsSet];
};

const fillUserIdSetForMediaLibraryItems = (mediaLibraryItem, set) => {
  set.add(mediaLibraryItem.createdBy);
  set.add(mediaLibraryItem.updatedBy);
  return set;
};

const fillUserIdSetForMediaTrashItems = (mediaTrashItem, set) => {
  set.add(mediaTrashItem.createdBy);
  set.add(mediaTrashItem.originalItem.createdBy);
  set.add(mediaTrashItem.originalItem.updatedBy);
  return set;
};

export const extractUserIdsFromMediaLibraryItems = mediaLibraryItems => {
  const idsSet = mediaLibraryItems.reduce((set, item) => fillUserIdSetForMediaLibraryItems(item, set), new Set());
  return [...idsSet];
};

export const extractUserIdsFromMediaTrashItems = mediaTrashItems => {
  const idsSet = mediaTrashItems.reduce((set, item) => fillUserIdSetForMediaTrashItems(item, set), new Set());
  return [...idsSet];
};

const fillUserIdSetForRoomMediaItems = (roomMediaItem, set) => {
  set.add(roomMediaItem.createdBy);
  return set;
};

export const extractUserIdsFromRoomMediaItems = roomMediaItems => {
  const idsSet = roomMediaItems.reduce((set, item) => fillUserIdSetForRoomMediaItems(item, set), new Set());
  return [...idsSet];
};
