import { DOCUMENT_ACCESS_LEVEL, ROOM_ACCESS_LEVEL } from '../domain/constants.js';

const determineUpcomingDueDocument = (now, documents) => {
  const timeOfChecking = now instanceof Date ? now.toISOString() : now;

  const upcomingDueDocument = documents.find((document, index) => {
    const isFutureLesson = document.dueOn >= timeOfChecking;
    const previousDocumentDueOn = documents[index - 1]?.dueOn;
    const previousDocumentIsPastDue = !previousDocumentDueOn || previousDocumentDueOn < timeOfChecking;
    return isFutureLesson && previousDocumentIsPastDue;
  });

  return upcomingDueDocument;
};

const determineDocumentAccessFromRoom = room => {
  switch (room?.access) {
    case ROOM_ACCESS_LEVEL.private:
      return DOCUMENT_ACCESS_LEVEL.private;
    case ROOM_ACCESS_LEVEL.public:
      return DOCUMENT_ACCESS_LEVEL.public;
    default:
      return DOCUMENT_ACCESS_LEVEL.public;
  }
};

export default {
  determineUpcomingDueDocument,
  determineDocumentAccessFromRoom
};
