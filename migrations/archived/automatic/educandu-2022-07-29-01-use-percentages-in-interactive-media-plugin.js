/* eslint-disable camelcase, no-console, no-await-in-loop */

import by from 'thenby';

export default class Educandu_2022_07_29_01_use_percentages_in_interactive_media_plugin {
  constructor(db) {
    this.db = db;
  }

  round(num) {
    return parseFloat(num.toFixed(15));
  }

  timecodeToPercentage(timecode, duration, fallbackValue) {
    return Math.max(0, Math.min(1, duration ? this.round(timecode / duration) : fallbackValue));
  }

  processSectionContent(content) {
    const { sourceDuration, sourceStartTimecode, sourceStopTimecode, chapters } = content;

    content.playbackRange = [
      this.timecodeToPercentage(sourceStartTimecode ?? 0, sourceDuration, 0),
      this.timecodeToPercentage(sourceStopTimecode ?? sourceDuration, sourceDuration, 1)
    ];

    const playbackDuration = (content.playbackRange[1] - content.playbackRange[0]) * sourceDuration;

    content.chapters = chapters
      .map((chapter, index) => {
        chapter.startPosition = this.timecodeToPercentage(chapter.startTimecode, playbackDuration, index / chapters.length);
        delete chapter.startTimecode;
        return chapter;
      })
      .sort(by(chapter => chapter.startPosition));

    delete content.sourceDuration;
    delete content.sourceStartTimecode;
    delete content.sourceStopTimecode;
    delete content.startTimecode;
    delete content.stopTimecode;
  }

  async processCollection(collectionName) {
    const toUpdate = await this.db.collection(collectionName).find({ 'sections.type': 'interactive-media' }).toArray();
    let updateCount = 0;

    for (const doc of toUpdate) {
      let docWasUpdated = false;
      for (const section of doc.sections) {
        if (section.type === 'interactive-media' && section.content) {
          this.processSectionContent(section.content);
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
