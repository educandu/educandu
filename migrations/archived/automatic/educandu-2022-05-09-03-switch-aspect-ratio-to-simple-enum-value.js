export default class Educandu_2022_05_09_03_switch_aspect_ratio_to_simple_enum_value {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const result1 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.aspectRatio': '4:3'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.content.aspectRatio.h': 4
          }
        ],
        multi: true
      }
    );

    const result2 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.aspectRatio': '16:9'
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.content.aspectRatio.h': { $exists: true }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated 4:3 in ${collectionName}: ${JSON.stringify(result1)}`);
    console.log(`Updated 16:9 in ${collectionName}: ${JSON.stringify(result2)}`);
  }

  async collectionDown(collectionName) {
    const result1 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.aspectRatio': {
            h: 4,
            v: 3
          }
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.content.aspectRatio': '4:3'
          }
        ],
        multi: true
      }
    );

    const result2 = await this.db.collection(collectionName).updateMany(
      {},
      {
        $set: {
          'sections.$[sectionElement].content.aspectRatio': {
            h: 16,
            v: 9
          }
        }
      },
      {
        arrayFilters: [
          {
            'sectionElement.content.aspectRatio': { $type: 'string' }
          }
        ],
        multi: true
      }
    );

    console.log(`Updated 4:3 in ${collectionName}: ${JSON.stringify(result1)}`);
    console.log(`Updated 16:9 in ${collectionName}: ${JSON.stringify(result2)}`);
  }

  async up() {
    await this.collectionUp('lessons');
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('lessons');
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
