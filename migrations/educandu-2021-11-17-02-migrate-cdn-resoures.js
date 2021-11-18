// eslint-disable-next-line camelcase

const pluginsWithCdnResources = new Set([
  'image',
  'video',
  'image-tiles',
  'audio',
  'anavis',
  'ear-training'
]);

const INTERNAL_URL_TYPE = 'internal';
const processImageSection = section => {
  const urls = section.content.sourceType === INTERNAL_URL_TYPE ? [section.content.sourceUrl] : [];

  if (section.content.effect?.sourceType === INTERNAL_URL_TYPE) {
    urls.push(section.content.effect.sourceUrl);
  }

  return urls;
};

const processVideoSection = section =>  section.content.sourceType === INTERNAL_URL_TYPE ? [section.content.sourceUrl] : [];

const processImageTilesSection = section => {
  return section.content.tiles?.reduce((acc, tile) => {
    if (tile.image.type === INTERNAL_URL_TYPE) {
      acc.push(tile.image.url);
    }

    return acc
  }, []) || [];
}

const processEarTrainingSection = section => {
  return section.content.tests?.reduce((acc, test) => {
    if(test.sound?.type === INTERNAL_URL_TYPE) {
      acc.push(test.sound?.url);
    }

    return acc;
  }, []) || [];
}

const processAnavisSection = section => section.content.media?.type === INTERNAL_URL_TYPE ? [section.content.media.url] : [];

const processAudioSection = section => section.content.type === INTERNAL_URL_TYPE ? [section.content.url]: [];


const aggregateSectionUrls = sections => sections.reduce((acc, section) => {
  switch (section.type) {
    case 'image':
      return [...acc, ...processImageSection(section)];
    case 'video':
      return [...acc, ...processVideoSection(section)];
    case 'image-tiles':
      return [...acc, ...processImageTilesSection(section)];
    case 'ear-training':
      return [...acc, ...processEarTrainingSection(section)];
    case 'anavis':
      return [...acc, ...processAnavisSection(section)];
    case 'audio':
      return [...acc, ...processAudioSection(section)]
    default:
      throw new Error('Unsupported type');
  }
}, []);

async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  /* eslint-disable-next-line no-await-in-loop */
  while (await cursor.hasNext()) {
    /* eslint-disable-next-line no-await-in-loop */
    const doc = await cursor.next();
    /* eslint-disable-next-line no-await-in-loop */
    await updateFn(doc);
    /* eslint-disable-next-line no-await-in-loop */
    await collection.replaceOne({ _id: doc._id }, doc);
  }
}

export default class Educandu_2021_11_17_02_migrate_cdn_resources {
  constructor(db) {
    this.db = db;
  }

  async up() {
    this.db.collection('documents')

    await updateAll(this.db.collection('documents'), {}, (doc) => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      doc.cdnResourceUrls = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];
    });

    await updateAll(this.db.collection('documentRevisions'), {}, (doc) => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      doc.cdnResourceUrls = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];
    });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { cdnResourceUrls: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { cdnResourceUrls: '' } });
  }
}
