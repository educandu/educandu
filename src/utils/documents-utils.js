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

export default {
  determineUpcomingDueDocument
};
