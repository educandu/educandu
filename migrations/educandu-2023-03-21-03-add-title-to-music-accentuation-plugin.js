export const TYPE = {
  assignment: 'assignment',
  harmony: 'harmony',
  hint: 'hint',
  melody: 'melody',
  movement: 'movement',
  playing: 'playing',
  reading: 'reading',
  research: 'research',
  rhythm: 'rhythm',
  standardSolution: 'standard-solution'
};

const getTitleFromType = type => {
  switch (type) {
    case TYPE.assignment:
      return 'Aufgabe';
    case TYPE.harmony:
      return 'Harmonie';
    case TYPE.hint:
      return 'Hinweis';
    case TYPE.melody:
      return 'Melodie';
    case TYPE.movement:
      return 'Bewegung';
    case TYPE.playing:
      return 'Musizieren';
    case TYPE.reading:
      return 'Lesen';
    case TYPE.research:
      return 'Recherche';
    case TYPE.rhythm:
      return 'Rhythmus';
    case TYPE.standardSolution:
      return 'Musterlösung';
    default:
      return 'Hinweis';
  }
};

export default class Educandu_2023_03_21_03_add_title_to_music_accentuation_plugin {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    const pluginType = 'music-accentuation';
    const cursor = this.db.collection(collectionName).find({ 'sections.type': pluginType });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections) {
        if (section.type === pluginType && !!section.content) {
          section.content.icon = section.content.type;
          section.content.title = getTitleFromType(section.content.type);
          delete section.content.type;
          count += 1;
        }
      }

      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    console.log(`Migrated ${count} '${pluginType}' sections in ${collectionName}`);
  }

  async collectionDown(collectionName) {
    const pluginType = 'music-accentuation';
    const cursor = this.db.collection(collectionName).find({ 'sections.type': pluginType });

    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections) {
        if (section.type === pluginType && !!section.content) {
          section.content.type = section.content.icon;
          delete section.content.title;
          delete section.content.icon;
          count += 1;
        }
      }

      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    console.log(`Migrated ${count} '${pluginType}' sections in ${collectionName}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  async down() {
    await this.collectionDown('documents');
    await this.collectionDown('documentRevisions');
  }
}
