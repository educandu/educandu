const { updateAll } = require('./helpers');
const Database = require('../../src/stores/database');

class Migration2018120201 {
  static get inject() { return [Database]; }

  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.sections, { type: 'youtube-video' }, doc => {
      doc.type = 'video';
      doc.content = Object.entries(doc.content).reduce((accu, [key, val]) => {
        accu[key] = {
          type: 'youtube',
          url: `https://www.youtube.com/watch?v=${val.videoId}`,
          text: val.text || '',
          width: val.maxWidth,
          aspectRatio: { h: 16, v: 9 },
          showVideo: true
        };
        return accu;
      }, {});
    });
  }

  async down() {
    await updateAll(this.db.sections, { type: 'video' }, doc => {
      const languages = Object.keys(doc.content);
      if (!languages.length || !languages.every(lang => doc.content[lang].type === 'youtube')) {
        return;
      }

      doc.type = 'youtube-video';
      doc.content = Object.entries(doc.content).reduce((accu, [key, val]) => {
        const matches = (/^https:\/\/www\.youtube\.com\/watch?v=(.+)$/i).exec(val.url);
        accu[key] = {
          videoId: matches && matches[1],
          maxWidth: val.width,
          text: val.text
        };
        return accu;
      }, {});
    });
  }
}

module.exports = Migration2018120201;
