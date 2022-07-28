// eslint-disable-next-line camelcase
export default class Educandu_2022_01_21_01_add_render_media_to_markdown_and_annotation {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const updateFunc = section => {
      section.content.renderMedia = false;
    };
    await this.updateSectionsInCollection('documentRevisions', ['markdown', 'annotation'], updateFunc);
    await this.updateSectionsInCollection('documents', ['markdown', 'annotation'], updateFunc);
  }

  async down() {
    const updateFunc = section => {
      delete section.content.renderMedia;
    };

    await this.updateSectionsInCollection('documentRevisions', ['markdown', 'annotation'], updateFunc);
    await this.updateSectionsInCollection('documents', ['markdown', 'annotation'], updateFunc);
  }

  async updateSectionsInCollection(collectionName, sectionTypes, updateFunc) {
    await this.updateAll(collectionName, { 'sections.type': { $in: sectionTypes } }, doc => {
      const hasUpdates = doc.sections.reduce((accu, section) => accu || this.tryUpdateSection(section, sectionTypes, updateFunc), false);
      return hasUpdates ? doc : null;
    });
  }

  tryUpdateSection(section, sectionTypes, updateFunc) {
    if (sectionTypes.includes(section.type) && section.content) {
      updateFunc(section);
      return true;
    }

    return false;
  }

  async updateAll(collectionName, filter, updateFn) {
    const collection = this.db.collection(collectionName);
    const cursor = collection.find(filter);

    // eslint-disable-next-line no-await-in-loop
    while (await cursor.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      const doc = await cursor.next();
      // eslint-disable-next-line no-await-in-loop
      const updatedDoc = await updateFn(doc);
      if (updatedDoc) {
        // eslint-disable-next-line no-console
        console.log(`Updating: ${collectionName}, id = ${doc._id}`);
        // eslint-disable-next-line no-await-in-loop
        await collection.replaceOne({ _id: doc._id }, updatedDoc);
      }
    }
  }
}
