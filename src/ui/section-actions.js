export const HARD_DELETE = 'hard-delete';

export function createHardDelete(section, reason, deleteDescendants) {
  return {
    name: HARD_DELETE,
    data: {
      sectionKey: section.key,
      sectionRevision: section.revision,
      reason,
      deleteDescendants
    }
  };
}

export default {
  HARD_DELETE,
  createHardDelete
};
