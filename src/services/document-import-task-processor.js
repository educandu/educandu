const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

export class DocumentImportTaskProcessor {
  async process(task, ctx) {
    await delay(2000);
    if (ctx.cancellationRequested) {
      throw new Error();
    }

    if (Math.random() > 0.5) {
      throw new Error('Mäh');
    }
  }
}
