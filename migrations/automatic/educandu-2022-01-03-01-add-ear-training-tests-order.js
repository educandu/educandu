/* eslint-disable camelcase, no-await-in-loop, no-console */
const PLUGIN_TYPE = 'ear-training';

export default class Educandu_2022_01_03_01_add_ear_training_tests_order {
  constructor(db) {
    this.db = db;
  }

  async updateCollection(collection, doUpdate) {
    const cursor = collection.find({ 'sections.type': PLUGIN_TYPE });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const isUpdated = await doUpdate(doc);

      if (isUpdated) {
        await collection.replaceOne({ _id: doc._id }, doc);
      }
    }
  }

  docUp(doc) {
    let changedSectionsCount = 0;

    doc.sections
      .filter(section => section.content && section.type === PLUGIN_TYPE)
      .forEach(section => {
        if (!section.content.testsOrder) {
          section.content.testsOrder = 'random';
          changedSectionsCount += 1;
        }
      });

    if (changedSectionsCount) {
      const docType = doc.revision ? 'document' : 'documentRevision';
      console.log(`Updating ${changedSectionsCount} section(s) in ${docType} '${doc._id}'`);

      return true;
    }

    return false;
  }

  docDown(doc) {
    let changedSectionsCount = 0;

    doc.sections
      .filter(section => section.content && section.type === PLUGIN_TYPE)
      .forEach(section => {
        if (section.content.testsOrder) {
          delete section.content.testsOrder;
          changedSectionsCount += 1;
        }
      });

    if (changedSectionsCount) {
      const docType = doc.revision ? 'document' : 'documentRevision';
      console.log(`Updating ${changedSectionsCount} section(s) in ${docType} '${doc._id}'`);

      return true;
    }

    return false;
  }

  async up() {
    await this.updateCollection(this.db.collection('documentRevisions'), this.docUp);
    await this.updateCollection(this.db.collection('documents'), this.docUp);
  }

  async down() {
    await this.updateCollection(this.db.collection('documentRevisions'), this.docDown);
    await this.updateCollection(this.db.collection('documents'), this.docDown);
  }
}
