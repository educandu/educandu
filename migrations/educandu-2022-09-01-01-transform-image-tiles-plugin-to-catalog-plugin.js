export default class Educandu_2022_09_01_01_transform_image_tiles_plugin_to_catalog_plugin {
  constructor(db) {
    this.db = db;
  }

  sectionUp(section) {
    section.type = 'catalog';

    if (section.content) {
      section.content = {
        displayMode: 'image-tiles',
        title: '',
        width: section.content.width,
        items: section.content.tiles.map(tile => ({
          title: tile.description,
          image: tile.image,
          link: tile.link
        })),
        imageTilesConfig: {
          maxTilesPerRow: section.content.maxTilesPerRow,
          hoverEffect: section.content.hoverEffect
        }
      };
    }

    return section;
  }

  sectionDown(section) {
    section.type = 'image-tiles';

    if (section.content) {
      section.content = {
        tiles: section.content.items.map(item => ({
          description: item.title,
          image: item.image,
          link: item.link
        })),
        maxTilesPerRow: section.content.imageTilesConfig.maxTilesPerRow,
        width: section.content.width,
        hoverEffect: section.content.imageTilesConfig.hoverEffect
      };
    }

    return section;
  }

  async processCollection(collectionName, sectionType, sectionHandler) {
    const docsToUpdate = await this.db.collection(collectionName).find({ 'sections.type': sectionType }).toArray();

    for (const doc of docsToUpdate) {
      console.log(`Updating ${collectionName} ${doc._id}`);
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, {
        ...doc,
        sections: doc.sections.map(section => section.type === sectionType ? sectionHandler(section) : section)
      });
    }

    return docsToUpdate.length;
  }

  async up() {
    const documentsCount = await this.processCollection('documents', 'image-tiles', section => this.sectionUp(section));
    const documentRevisionsCount = await this.processCollection('documentRevisions', 'image-tiles', section => this.sectionUp(section));
    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  async down() {
    const documentsCount = await this.processCollection('documents', 'catalog', section => this.sectionDown(section));
    const documentRevisionsCount = await this.processCollection('documentRevisions', 'catalog', section => this.sectionDown(section));
    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }
}
