import Database from './database.js';
import { validate } from '../domain/validation.js';
import { storagePlanDBSchema } from '../domain/schemas/storage-plan-schemas.js';

class StoragePlanStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.storagePlans;
  }

  getAllStoragePlans({ session } = {}) {
    return this.collection.find({}, { session }).toArray();
  }

  getAllStoragePlansWithAssignedUserCount({ session } = {}) {
    return this._getStoragePlansWithAssignedUserCount({}, { session });
  }

  getStoragePlanById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  async getStoragePlanWithAssignedUserCountById(id, { session } = {}) {
    const allPlans = await this._getStoragePlansWithAssignedUserCount({ _id: id }, { session });
    return allPlans[0];
  }

  async saveStoragePlan(storagePlan, { session } = {}) {
    validate(storagePlan, storagePlanDBSchema);
    await this.collection.replaceOne({ _id: storagePlan._id }, storagePlan, { session, upsert: true });
  }

  async deleteStoragePlanById(storagePlanId, { session } = {}) {
    await this.collection.deleteOne({ _id: storagePlanId }, { session });
  }

  _getStoragePlansWithAssignedUserCount(matchFilter, { session } = {}) {
    const pipeline = [
      {
        $match: matchFilter
      }, {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'storage.planId',
          as: '_tmpAssignedUserCountObject_',
          pipeline: [
            {
              $count: 'count'
            }
          ]
        }
      }, {
        $set: {
          assignedUserCount: { $sum: '$_tmpAssignedUserCountObject_.count' }
        }
      }, {
        $unset: '_tmpAssignedUserCountObject_'
      }
    ];

    return this.collection.aggregate(pipeline, { session }).toArray();
  }
}

export default StoragePlanStore;
