export default class Educandu_2022_12_19_01_make_userId_unique_in_passwordResetRequest {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const collection = this.db.collection('passwordResetRequests');

    const groups = await collection.aggregate([{ $group: { _id: '$userId', count: { $count: { } } } }]).toArray();
    const userIdsWithMultipleRequests = groups.filter(g => g.count > 1).map(g => g._id);

    console.log(`Found ${userIdsWithMultipleRequests.length} users with multiple password reset requests.`);

    for (const userId of userIdsWithMultipleRequests) {
      const requests = await collection.find({ userId }).sort({ expires: -1 }).toArray();
      const idOfLatestRequest = requests[0]._id;

      await collection.deleteMany({ _id: { $ne: idOfLatestRequest } });

      console.log(`Reduced password reset requests for user ${userId} to one: ${idOfLatestRequest}`);
    }

    await collection.createIndexes([
      {
        name: '_idx_userId_',
        key: { userId: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.collection('passwordResetRequests').dropIndex('_idx_userId');
  }
}
