/* eslint-disable camelcase, no-console, no-await-in-loop */
export default class Educandu_2022_09_20_01_rework_effects_in_image_plugin {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'image' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {

        if (section.type === 'image' && section.content && !section.content.effectType) {
          section.content.hoverEffect = {
            sourceType: 'internal',
            sourceUrl: '',
            copyrightNotice: ''
          };
          section.content.revealEffect = {
            sourceType: 'internal',
            sourceUrl: '',
            copyrightNotice: '',
            startPosition: 0,
            orientation: 'horizontal'
          };
          section.content.clipEffect = {
            region: {
              x: 0,
              y: 0,
              width: 0,
              height: 0
            }
          };
          const effectType = section.content.effect?.type || 'none';
          section.content.effectType = effectType;

          if (effectType === 'hover') {
            section.content.hoverEffect.sourceType = section.content.effect.sourceType;
            section.content.hoverEffect.sourceUrl = section.content.effect.sourceUrl;
            section.content.hoverEffect.copyrightNotice = section.content.effect.copyrightNotice;
          }
          if (effectType === 'reveal') {
            section.content.revealEffect.sourceType = section.content.effect.sourceType;
            section.content.revealEffect.sourceUrl = section.content.effect.sourceUrl;
            section.content.revealEffect.copyrightNotice = section.content.effect.copyrightNotice;
            section.content.revealEffect.startPosition = section.content.effect.startPosition;
            section.content.revealEffect.orientation = section.content.effect.orientation;
          }
          if (effectType === 'clip') {
            section.content.clipEffect.region.x = section.content.effect.region.x;
            section.content.clipEffect.region.y = section.content.effect.region.y;
            section.content.clipEffect.region.width = section.content.effect.region.width;
            section.content.clipEffect.region.height = section.content.effect.region.height;
          }

          delete section.content.effect;
          docWasUpdated = true;

          console.log(`Updating ${collectionName} ${doc._id} - section ${section.key}`);
        }
      }
      if (docWasUpdated) {
        updateCount += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    return updateCount;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw new Error('Not available');
  }
}
