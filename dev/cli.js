import yargs from 'yargs';

export const cliArgs = yargs(process.argv.slice(2)).argv;
