export const HARD_DELETE = 'hard-delete';

export function createHardDelete(section, deletionReason, deleteDescendants) {
  return {
    name: HARD_DELETE,
    data: {
      sectionId: section._id,
      sectionKey: section.key,
      sectionOrder: section.order,
      deletionReason: deletionReason,
      deleteDescendants: deleteDescendants
    }
  };
}

export default {
  HARD_DELETE,
  createHardDelete
};
