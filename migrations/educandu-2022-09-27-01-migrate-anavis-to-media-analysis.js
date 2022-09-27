/* eslint-disable camelcase, no-console, no-await-in-loop */
import uniqueId from '../src/utils/unique-id.js';

const getTotalPreviousPartsLength = (parts, currentPartIndex) => {
  return parts.slice(0, currentPartIndex).reduce((acc, part) => acc + part.length, 0);
};

export default class Educandu_2022_09_27_01_migrate_anavis_to_media_analysis {
  constructor(db) {
    this.db = db;
  }

  sectionUp(section) {
    section.type = 'media-analysis';

    if (section.content) {
      const partsTotalLength = getTotalPreviousPartsLength(section.content.parts, section.content.parts.length);

      const mediaAnalysisContent = {
        width: section.content.width,
        mainTrack: {
          name: '',
          sourceType: section.content.media.sourceType,
          sourceUrl: section.content.media.sourceUrl,
          copyrightNotice: section.content.media.copyrightNotice,
          aspectRatio: section.content.media.aspectRatio,
          showVideo: section.content.media.kind === 'video',
          playbackRange: [0, 1],
          volume: 1
        },
        secondaryTracks: [],
        chapters: section.content.parts.map((part, index) => {
          const lengthUntilPart = getTotalPreviousPartsLength(section.content.parts, index);
          const sanitizedAnnotations = part.annotations
            .filter(annotation => annotation)
            .map(annotation => {
              const match = annotation.match(/^(\d+\.)/);
              return match ? annotation.replace(match[0], match[0].replace('.', '\\.')) : annotation;
            });

          return {
            key: uniqueId.create(),
            startPosition: lengthUntilPart / partsTotalLength,
            color: part.color,
            title: part.name,
            text: sanitizedAnnotations.join('\\\n')
          };
        })
      };
      section.content = mediaAnalysisContent;
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
    const documentsCount = await this.processCollection('documents', 'anavis', section => this.sectionUp(section));
    const documentRevisionsCount = await this.processCollection('documentRevisions', 'anavis', section => this.sectionUp(section));
    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw new Error('Not supported: cannot distinguish between original and migrated media-analysis sections');
  }
}
