import { promises as fs } from 'node:fs';

const IMAGE_TILE_SECTION_TYPE = 'image-tiles';

export default class Educandu_2021_12_29_01_repair_image_tiles {
  constructor(db) {
    this.db = db;
  }

  async fixTile(collectionName, documentLinkInfo) {
    const docsOrRevisions = await this.db.collection(collectionName).find({
      'key': documentLinkInfo.documentKey,
      'sections.key': documentLinkInfo.sectionKey,
      'sections.revision': documentLinkInfo.sectionRevision
    }).toArray();

    for (const docOrRevision of docsOrRevisions) {
      const imageTilesSections = docOrRevision.sections.filter(section => section.type === IMAGE_TILE_SECTION_TYPE && Array.isArray(section.content?.tiles))
        .filter(section => section.key === documentLinkInfo.sectionKey && section.revision === documentLinkInfo.sectionRevision);

      if (imageTilesSections.length !== 1) {
        console.log(documentLinkInfo);
        console.log('Found unexpected number of tile sections', imageTilesSections.length);
      }
      const tiles = imageTilesSections[0].content.tiles;

      if (tiles.length < documentLinkInfo.tileIndex + 1) {
        console.log(documentLinkInfo);
        console.log('Number of tile sections', tiles.length, 'tile index: ', documentLinkInfo.tileIndex, 'revision', docOrRevision._id);
      }

      const doc = await this.db.collection('documents').findOne({ slug: documentLinkInfo.url });

      const linkType = tiles[documentLinkInfo.tileIndex]?.link.type;

      if (linkType !== 'internal') {
        console.log(`Document info tile is not of expected type, but of type ${linkType}`);
        console.log(documentLinkInfo);
      } else if (!doc) {
        console.log('Could not find document for slug: ', documentLinkInfo.url);
        tiles[documentLinkInfo.tileIndex].link.url = '';
      } else {
        tiles[documentLinkInfo.tileIndex].link.url = doc.key;
      }

      await this.db.collection(collectionName).replaceOne({ _id: docOrRevision._id }, docOrRevision);
    }
  }

  async up() {
    const revsDataRaw = await fs.readFile('./migrations/manual/revs-image-tiles.json', 'utf8');
    const revsData = JSON.parse(revsDataRaw);

    for (let i = 0; i < revsData.length; i += 1) {
      const revData = revsData[i];

      console.log(`Processing revision ${i} of ${revsData.length} document key`, revData.documentKey);
      await this.fixTile('documentRevisions', revData);
    }

    const docsDataRaw = await fs.readFile('./migrations/manual/docs-image-tiles.json', 'utf8');
    const docsData = JSON.parse(docsDataRaw);

    for (let i = 0; i < docsData.length; i += 1) {
      const docData = docsData[i];

      console.log(`Processing document ${i} of ${docsData.length} document key`, docData.documentKey);
      await this.fixTile('documents', docData);
    }
  }

  async down() {
  }
}
