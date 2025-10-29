// Helper functions copied from the codebase to make this migration independent

const DAY_OF_WEEK = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

function getDayOfWeek(date) {
  const day = date.getDay();
  switch (day) {
    case 0:
      return DAY_OF_WEEK.sunday;
    case 1:
      return DAY_OF_WEEK.monday;
    case 2:
      return DAY_OF_WEEK.tuesday;
    case 3:
      return DAY_OF_WEEK.wednesday;
    case 4:
      return DAY_OF_WEEK.thursday;
    case 5:
      return DAY_OF_WEEK.friday;
    case 6:
      return DAY_OF_WEEK.saturday;
    default:
      return null;
  }
}

function dateToNumericDay(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

function getStartOfDay(date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export default class Educandu_2025_10_29_02_migrate_documentRequests_to_dailyDocumentRequests {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const documentRequests = this.db.collection('documentRequests');
    const dailyDocumentRequests = this.db.collection('dailyDocumentRequests');

    // Default expiry timeout (same as server config default)
    const expiryTimeoutInDays = 365;

    // Group document requests by documentId, day, and dayOfWeek
    const aggregationMap = new Map();

    const cursor = documentRequests.find({});

    let processedCount = 0;

    for await (const request of cursor) {
      const startOfDay = getStartOfDay(request.registeredOn);
      const day = dateToNumericDay(startOfDay);
      const dayOfWeek = getDayOfWeek(startOfDay);

      // Create a unique key for this document/day/dayOfWeek combination
      const key = `${request.documentId}|${day}|${dayOfWeek}`;

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          documentId: request.documentId,
          day,
          dayOfWeek,
          expiresOn: addDays(startOfDay, expiryTimeoutInDays + 1),
          totalCount: 0,
          readCount: 0,
          writeCount: 0,
          anonymousCount: 0,
          loggedInCount: 0
        });
      }

      const aggregation = aggregationMap.get(key);

      // Increment counters based on request properties
      aggregation.totalCount += 1;
      aggregation.readCount += request.isWriteRequest ? 0 : 1;
      aggregation.writeCount += request.isWriteRequest ? 1 : 0;
      aggregation.anonymousCount += request.isLoggedInRequest ? 0 : 1;
      aggregation.loggedInCount += request.isLoggedInRequest ? 1 : 0;

      processedCount += 1;

      if (processedCount % 1000 === 0) {
        console.log(`Processed ${processedCount} document requests...`);
      }
    }

    console.log(`Finished processing ${processedCount} document requests.`);
    console.log(`Creating ${aggregationMap.size} daily document request entries...`);

    // Insert all aggregated entries into dailyDocumentRequests
    let insertedCount = 0;
    const batchSize = 100;
    const batch = [];

    for (const entry of aggregationMap.values()) {
      batch.push(entry);

      if (batch.length >= batchSize) {
        await dailyDocumentRequests.insertMany(batch);
        insertedCount += batch.length;
        batch.length = 0;
        console.log(`Inserted ${insertedCount} daily document request entries...`);
      }
    }

    // Insert remaining entries
    if (batch.length > 0) {
      await dailyDocumentRequests.insertMany(batch);
      insertedCount += batch.length;
    }

    console.log(`Migration completed. Inserted ${insertedCount} daily document request entries.`);
  }

  async down() {
    // Remove all entries from dailyDocumentRequests
    await this.db.collection('dailyDocumentRequests').deleteMany({});
    console.log('Rolled back: Removed all entries from dailyDocumentRequests collection.');
  }
}
