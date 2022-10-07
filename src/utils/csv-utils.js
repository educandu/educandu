import papaparse from 'papaparse';

export function objectsToCsv(objects, headerKeys) {
  const encodeCsvValue = value => {
    return typeof value === 'number'
      ? value.toString()
      : `"${String(value).replace(/"/g, '""')}"`;
  };

  const toCsvRow = values => values.map(encodeCsvValue).join(',');

  const headerRow = toCsvRow(headerKeys);
  const bodyRows = objects.map(obj => toCsvRow(headerKeys.map(key => obj[key])));

  return [headerRow, ...bodyRows, ''].join('\n');
}

export function csvToObjects(csvStringOrFile) {
  return new Promise((resolve, reject) => {
    const rejectWithCsvError = error => reject(Object.assign(new Error(), error));

    papaparse.parse(csvStringOrFile, {
      header: true,
      skipEmptyLines: true,
      error: error => rejectWithCsvError(error),
      complete: ({ data, errors }) => errors.length ? rejectWithCsvError(errors[0]) : resolve(data)
    });
  });
}
