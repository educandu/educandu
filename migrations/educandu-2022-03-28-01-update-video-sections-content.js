/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_03_28_01_update_video_sections_content {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'video' }).toArray();
    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'video') {
          section.content.sourceType = section.content.type;
          section.content.sourceUrl = section.content.url;
          section.content.posterImage = { sourceType: 'internal', sourceUrl: '' };

          delete section.content.type;
          delete section.content.url;

          docWasUpdated = true;
          console.log(`${collectionName} ${doc._id} section ${section.key} set content.sourceType to ${section.content.sourceType} and content.sourceUrl to ${section.content.sourceUrl}`);
        }
      }
      if (docWasUpdated) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }
  }

  async collectionDown(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'video' }).toArray();
    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'video') {
          section.content.type = section.content.sourceType;
          section.content.url = section.content.sourceUrl;

          delete section.content.sourceType;
          delete section.content.sourceuUl;
          delete section.content.posterImage;

          docWasUpdated = true;
          console.log(`${collectionName} ${doc._id} section ${section.key} set content.type to ${section.content.type} and content.url to ${section.content.url}`);
        }
      }
      if (docWasUpdated) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }
  }

  async up() {
    await this.collectionUp('lessons');
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('lessons');
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
