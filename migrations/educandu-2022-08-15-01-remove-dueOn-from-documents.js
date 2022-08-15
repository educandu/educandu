/* eslint-disable camelcase, no-console */

import moment from 'moment';

const localePattern = 'L, LT';

export default class Educandu_2022_08_11_01_remove_dueOn_from_documents {
  constructor(db) {
    this.db = db;
  }

  async updateCollection(collectionName) {
    const docs = await this.db.collection(collectionName).find({ dueOn: { $ne: null } }).toArray();

    for (const doc of docs) {
      const formattedDueOnDate = moment(doc.dueOn).locale(doc.language).format(localePattern);
      doc.title = `${formattedDueOnDate} - ${doc.title}`;

      // eslint-disable-next-line no-await-in-loop
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      console.log(`Updated doc with _id '${doc._id}' in ${collectionName}. New title: '${doc.title}'`);
    }
  }

  async up() {
    await this.updateCollection('documentRevisions');
    await this.updateCollection('documents');

    await this.db.collection('documentRevisions').updateMany({}, { $unset: { dueOn: null } });
    await this.db.collection('documents').updateMany({}, { $unset: { dueOn: null } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { dueOn: null } });
    await this.db.collection('documents').updateMany({}, { $set: { dueOn: null } });
  }
}
