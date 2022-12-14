export default class Educandu_2022_02_08_01_add_quick_tester_tests_order {
  constructor(db) {
    this.db = db;
  }

  async updateCollection(collection, docType, updateSectionsFunc) {
    const cursor = collection.find({ 'sections.type': 'quick-tester' });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updatedSectionsCount = await updateSectionsFunc(doc);
      if (updatedSectionsCount) {
        console.log(`Updating ${updatedSectionsCount} section(s) in ${docType} ${doc._id}`);
        await collection.replaceOne({ _id: doc._id }, doc);
      }
    }
  }

  addTestsOrder(doc) {
    return doc.sections
      .filter(section => section.type === 'quick-tester' && section.content && !section.content.testsOrder)
      .reduce((updatedSectionsCount, section) => {
        section.content.testsOrder = 'random';
        return updatedSectionsCount + 1;
      }, 0);
  }

  removeTestsOrder(doc) {
    return doc.sections
      .filter(section => section.type === 'quick-tester' && section.content && section.content.testsOrder)
      .reduce((updatedSectionsCount, section) => {
        delete section.content.testsOrder;
        return updatedSectionsCount + 1;
      }, 0);
  }

  async up() {
    await this.updateCollection(this.db.collection('documentRevisions'), 'document revision', doc => this.addTestsOrder(doc));
    await this.updateCollection(this.db.collection('documents'), 'document', doc => this.addTestsOrder(doc));
    await this.updateCollection(this.db.collection('lessons'), 'lesson', doc => this.addTestsOrder(doc));
  }

  async down() {
    await this.updateCollection(this.db.collection('documentRevisions'), 'documentRevision', doc => this.removeTestsOrder(doc));
    await this.updateCollection(this.db.collection('documents'), 'document', doc => this.removeTestsOrder(doc));
    await this.updateCollection(this.db.collection('lessons'), 'lesson', doc => this.removeTestsOrder(doc));
  }
}
