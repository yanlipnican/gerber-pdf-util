import * as path from 'path';
import {convertGerberToPdf} from './index';

const cwd = process.cwd();
const argv = process.argv;

const inputPath1 = path.resolve(cwd, argv[2]);
const inputPath2 = path.resolve(cwd, argv[3]);
const outputPath = path.resolve(cwd);

const hasDrill = argv.indexOf('-d') !== -1;
const drill = hasDrill && {
    file: argv[argv.indexOf('-d') + 1],
    offset: { x: 3.8, y: 3.8 }
};

if (hasDrill && !drill) {
    throw new Error('Expected drillFile after "-d" option');
}

convertGerberToPdf([inputPath1, inputPath2], outputPath, drill)
    .then(() => console.log(`Successfully exported`))
    .catch((err) => console.error(err));
