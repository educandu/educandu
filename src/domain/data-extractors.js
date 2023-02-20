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
    docOrRev.publicContext.accreditedEditors.forEach(accreditedEditor => set.add(accreditedEditor));
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

export const extractUserIdsFromMediaLibraryItems = mediaLibraryItems => {
  const idsSet = mediaLibraryItems.reduce((set, item) => fillUserIdSetForMediaLibraryItems(item, set), new Set());
  return [...idsSet];
};

