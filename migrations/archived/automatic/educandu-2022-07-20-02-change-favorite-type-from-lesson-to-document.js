export default class Educandu_2022_07_20_02_change_favorite_type_from_lesson_to_document {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const result = await this.db.collection('users').updateMany(
      {},
      {
        $set: {
          'favorites.$[favoriteElement].type': 'document'
        }
      },
      {
        arrayFilters: [
          {
            'favoriteElement.type': 'lesson'
          }
        ],
        multi: true
      }
    );

    console.log(`Updated users: ${JSON.stringify(result)}`);
  }

  down() {
    throw new Error('Not implemented');
  }
}
