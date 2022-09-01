/* eslint-disable camelcase */

export default class Educandu_2022_09_01_02_change_image_tiles_to_catalog_in_help_texts_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').updateOne(
      { _id: 'pluginsHelpTexts' },
      { $rename: { 'value.image-tiles': 'value.catalog' } }
    );
  }

  async down() {
    await this.db.collection('settings').updateOne(
      { _id: 'pluginsHelpTexts' },
      { $rename: { 'value.catalog': 'value.image-tiles' } }
    );
  }
}
