const pluginsWithCdnResources = new Set([
  'image',
  'video',
  'image-tiles',
  'audio',
  'anavis',
  'ear-training',
  'markdown',
  'annotation'
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
    return [];
  }
  const regexp = /(?<=\]\(cdn:\/\/)(.*?)(?=\))/g;
  const matches = content.text.match(regexp);
  return matches || [];
};

const processAnnotationSection = ({ content }) => processMarkdownSection({ content });

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
    case 'annotation':
      return [...acc, ...processAnnotationSection(section)];
    default:
      throw new Error('Unsupported type');
  }
}, []);

async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const shouldUpdate = await updateFn(doc);

    if (shouldUpdate) {
      const docType = doc.revision ? 'document' : 'document revision';
      console.log(`Updating ${docType} '${doc._id}:'`);
      console.log(`    cdnResources: ${JSON.stringify(doc.cdnResources)}`);
      await collection.replaceOne({ _id: doc._id }, doc);
    }
  }
}

export default class Educandu_2021_12_16_02_migrate_cdn_resources_due_to_annotations {
  constructor(db) {
    this.db = db;
  }

  async up() {
    console.log('Updating documents ...');

    await updateAll(this.db.collection('documents'), {}, doc => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      const newCdnResources = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];

      if (newCdnResources.length === doc.cdnResources.length) {
        const intersection = newCdnResources.filter(x => doc.cdnResources.includes(x));
        if (intersection.length === newCdnResources.length) {
          return false;
        }
      }

      doc.cdnResources = newCdnResources;
      return true;
    });

    console.log('Updating document revisions ...');
    await updateAll(this.db.collection('documentRevisions'), {}, doc => {
      const relevantSections = doc.sections.filter(section => pluginsWithCdnResources.has(section.type));
      const newCdnResources = [...new Set(aggregateSectionUrls(relevantSections).filter(url => !!url))];

      if (newCdnResources.length === doc.cdnResources.length) {
        const intersection = newCdnResources.filter(x => doc.cdnResources.includes(x));
        if (intersection.length === newCdnResources.length) {
          return false;
        }
      }

      doc.cdnResources = newCdnResources;
      return true;
    });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { cdnResourceUrls: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { cdnResourceUrls: '' } });
  }
}
