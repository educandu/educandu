const fillUserIdSetForDocOrRevision = (docOrRev, set) => {
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
};

export const extractUserIdsFromDocsOrRevisions = docsOrRevisions => {
  const idsSet = docsOrRevisions.reduce((set, docOrRev) => fillUserIdSetForDocOrRevision(docOrRev, set), new Set());
  return [...idsSet];
};

