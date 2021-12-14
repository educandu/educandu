export const SECTION_ACTIONS = {
  hardDelete: 'hard-delete'
};

export function createHardDelete(section, reason, deleteAllRevisions) {
  return {
    name: SECTION_ACTIONS.hardDelete,
    data: {
      sectionKey: section.key,
      sectionRevision: section.revision,
      reason,
      deleteAllRevisions
    }
  };
}
