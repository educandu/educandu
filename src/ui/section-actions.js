const HARD_DELETE = 'hard-delete';

function createHardDelete(section, deletionReason, deleteDescendants) {
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

module.exports = {
  createHardDelete,
  HARD_DELETE
};
