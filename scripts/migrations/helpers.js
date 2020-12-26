export async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  /* eslint-disable-next-line no-await-in-loop */
  while (await cursor.hasNext()) {
    /* eslint-disable-next-line no-await-in-loop */
    const doc = await cursor.next();
    /* eslint-disable-next-line no-await-in-loop */
    await updateFn(doc);
    /* eslint-disable-next-line no-await-in-loop */
    await collection.replaceOne({ _id: doc._id }, doc);
  }
}

export default {
  updateAll
};
