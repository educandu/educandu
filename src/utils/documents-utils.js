import { DOCUMENT_ACCESS, ROOM_ACCESS } from '../domain/constants.js';

const determineUpcomingDueDocument = (now, documents) => {
  const timeOfChecking = now instanceof Date ? now.toISOString() : now;

  const upcomingDueDocument = documents.find((document, index) => {
    const documentIsDue = document.dueOn >= timeOfChecking;
    const previousDocumentDueOn = documents[index - 1]?.dueOn;
    const previousDocumentIsPastDue = !previousDocumentDueOn || previousDocumentDueOn < timeOfChecking;
    return documentIsDue && previousDocumentIsPastDue;
  });

  return upcomingDueDocument;
};

const determineDocumentAccessFromRoom = room => {
  switch (room?.access) {
    case ROOM_ACCESS.private:
      return DOCUMENT_ACCESS.private;
    case ROOM_ACCESS.public:
      return DOCUMENT_ACCESS.public;
    default:
      return DOCUMENT_ACCESS.public;
  }
};

export default {
  determineUpcomingDueDocument,
  determineDocumentAccessFromRoom
};
