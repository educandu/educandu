export default class Educandu_2022_04_25_01_rename_cell_properties_in_table_plugin {
  constructor(db) {
    this.db = db;
  }

  async updateAll(collection, query, updateFn) {
    const cursor = collection.find(query);

    while (await cursor.hasNext()) {
      const record = await cursor.next();
      const updatedRecord = await updateFn(record);
      if (updatedRecord) {
        await collection.replaceOne({ _id: record._id }, updatedRecord);
      }
    }
  }

  async up() {
    const updateFunction = section => {
      let hasUpdates = false;
      if (section.type === 'table' && section.content) {
        for (const cell of section.content.cells) {
          cell.rowIndex = cell.startRow;
          cell.columnIndex = cell.startColumn;
          delete cell.startRow;
          delete cell.startColumn;
          hasUpdates = true;
        }
      }

      return hasUpdates;
    };

    await this.updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'table' }, documentRevision => {
      const updateCount = documentRevision.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in document revision ${documentRevision._id}`);
      return updateCount ? documentRevision : null;
    });

    await this.updateAll(this.db.collection('documents'), { 'sections.type': 'table' }, document => {
      const updateCount = document.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in document ${document._id}`);
      return updateCount ? document : null;
    });

    await this.updateAll(this.db.collection('lessons'), { 'sections.type': 'table' }, lesson => {
      const updateCount = lesson.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in lesson ${lesson._id}`);
      return updateCount ? lesson : null;
    });
  }

  async down() {
    const updateFunction = section => {
      let hasUpdates = false;
      if (section.type === 'table' && section.content) {
        for (const cell of section.content.cells) {
          cell.startRow = cell.rowIndex;
          cell.startColumn = cell.columnIndex;
          delete cell.rowIndex;
          delete cell.columnIndex;
          hasUpdates = true;
        }
      }

      return hasUpdates;
    };

    await this.updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'table' }, documentRevision => {
      const updateCount = documentRevision.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in document revision ${documentRevision._id}`);
      return updateCount ? documentRevision : null;
    });

    await this.updateAll(this.db.collection('documents'), { 'sections.type': 'table' }, document => {
      const updateCount = document.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in document ${document._id}`);
      return updateCount ? document : null;
    });

    await this.updateAll(this.db.collection('lessons'), { 'sections.type': 'table' }, lesson => {
      const updateCount = lesson.sections.reduce((accu, section) => accu + Number(updateFunction(section)), 0);
      console.log(`Updating ${updateCount} sections in lesson ${lesson._id}`);
      return updateCount ? lesson : null;
    });
  }
}
