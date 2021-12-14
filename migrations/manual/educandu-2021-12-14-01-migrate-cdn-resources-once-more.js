/* eslint-disable camelcase, no-await-in-loop */

const pluginsWithCdnResources = new Set([
  'image',
  'video',
  'image-tiles',
  'audio',
  'anavis',
  'ear-training',
  'markdown'
]);

const INTERNAL_URL_TYPE = 'internal';
const processImageSection = ({ content }) => {
  const urls = content?.sourceType === INTERNAL_URL_TYPE ? [content.sourceUrl] : [];

  if (content?.effect?.sourceType === INTERNAL_URL_TYPE) {
    urls.push(content.effect.sourceUrl);
  }

  return urls;
};

const processVideoSection = ({ content }) => content?.sourceType === INTERNAL_URL_TYPE ? [content.sourceUrl] : [];

const processImageTilesSection = ({ content }) => {
  return content?.tiles?.reduce((acc, tile) => {
    if (tile.image?.type === INTERNAL_URL_TYPE) {
      acc.push(tile.image.url);
    }

    return acc;
  }, []) || [];
};

const processEarTrainingSection = ({ content }) => {
  return content?.tests?.reduce((acc, test) => {
    if (test.sound?.type === INTERNAL_URL_TYPE) {
      acc.push(test.sound.url);
    }

    return acc;
  }, []) || [];
};

const processAnavisSection = ({ content }) => content?.media?.type === INTERNAL_URL_TYPE ? [content.media.url] : [];

const processAudioSection = ({ content }) => content?.type === INTERNAL_URL_TYPE ? [content.url] : [];

const processMarkdownSection = ({ content }) => {
  if (!content) {
    return content;
  }
  const regexp = /(?<=\]\(cdn:\/\/)(.*?)(?=\))/g;
  const matches = content.match(regexp);
  return matches ? [...new Set(matches)] : [];
};

export const aggregateSectionUrls = sections => sections.reduce((acc, section) => {
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
      return [...acc, ...processAudioSection(section)];
    case 'markdown':
      return [...acc, ...processMarkdownSection(section)];
    default:
      throw new Error('Unsupported type');
  }
}, []);

async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    await updateFn(doc);
    await collection.replaceOne({ _id: doc._id }, doc);
  }
}

export default class Educandu_2021_12_14_01_migrate_cdn_resources_once_more {
  constructor(db) {
    this.db = db;
  }

  async up() {
    this.db.collection('documents');

    await updateAll(this.db.collection('documents'), {}, doc => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      doc.cdnResources = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];
    });

    await updateAll(this.db.collection('documentRevisions'), {}, doc => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      doc.cdnResources = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];
    });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { cdnResourceUrls: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { cdnResourceUrls: '' } });
  }
}
