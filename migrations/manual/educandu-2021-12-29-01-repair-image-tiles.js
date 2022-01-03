import { promises as fs } from 'fs';

// eslint-disable-next-line camelcase
export default class Educandu_2021_12_29_01_repair_image_tiles {
  constructor(db) {
    this.db = db;
  }

  async fixTile(documentLinkInfo) {
    const revisions = await this.db.collection('documentRevisions').find({
      'key': documentLinkInfo.documentKey,
      'sections.key': documentLinkInfo.sectionKey,
      'sections.revision': documentLinkInfo.sectionRevision
    }).toArray();

    for (const revision of revisions) {
      const imageTilesSections = revision.sections.filter(section => section.type === 'image-tiles' && Array.isArray(section.content?.tiles))
        .filter(section => section.key === documentLinkInfo.sectionKey && section.revision === documentLinkInfo.sectionRevision);

      if (imageTilesSections.length !== 1) {
        console.log(documentLinkInfo);
        console.log('Found unexpected number of tile sections', imageTilesSections.length);
      }

      if (imageTilesSections[0].content.tiles.length < documentLinkInfo.tileIndex + 1) {
        console.log(documentLinkInfo);
        console.log('Number of tile sections', imageTilesSections[0].content.tiles.length, 'tile index: ', documentLinkInfo.tileIndex, 'revision', revision._id);
      }
      // eslint-disable-next-line no-await-in-loop
      const doc = await this.db.collection('documents').findOne({ slug: documentLinkInfo.url });

      if (imageTilesSections[0].content.tiles[documentLinkInfo.tileIndex]?.link.type !== 'internal') {
        console.log(`Document info tile is not of expected type, but of type ${imageTilesSections[0].content.tiles[documentLinkInfo.tileIndex].link.type}`);
        console.log(documentLinkInfo);
      } else if (!doc) {
        console.log('Could not find document for slug: ', documentLinkInfo.url);
        imageTilesSections[0].content.tiles[documentLinkInfo.tileIndex].link.url = '';
      } else {
        imageTilesSections[0].content.tiles[documentLinkInfo.tileIndex].link.url = doc.key;
      }

      // eslint-disable-next-line no-await-in-loop
      await this.db.collection('documentRevisions').replaceOne({ _id: revision._id }, revision);
    }
  }

  async up() {
    const revsDataRaw = await fs.readFile('./migrations/manual/revs-image-tiles.json', 'utf8');
    const revsData = JSON.parse(revsDataRaw);

    for (let i = 0; i < revsData.length; i += 1) {
      const revData = revsData[i];

      console.log(`Processing ${i} of ${revsData.length} document key`, revData.documentKey);
      // eslint-disable-next-line no-await-in-loop
      await this.fixTile(revData);
    }
  }

  async down() {
  }
}
