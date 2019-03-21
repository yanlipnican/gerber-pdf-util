import * as fs from 'fs';
import {promisify} from 'util';
import * as GerberToSvg from 'gerber-to-svg';
import * as path from "path";
import * as PDFDocument from 'pdfkit';
import SVGtoPDFkit = require('svg-to-pdfkit');
import { JSDOM } from 'jsdom';

const readFile = promisify(fs.readFile);

const Convert = (code: string): Promise<GerberToSvg.Converter> => {
    return new Promise((resolve) => {
        let self: GerberToSvg.Converter = GerberToSvg(code, null, () => resolve(self));
    });
};

const getSvg = async (file: string, fill: string = "#fff"): Promise<string> => {
    const gerber = await readFile(file, 'utf-8');

    const converter = await Convert(gerber);

    console.log(`Reading "${file}"`);
    console.log(converter.width, converter.height, converter.units);

    converter.on('error', e => console.log('error:', e));
    converter.on('warning', e => console.log('warning:', e));

    let svg = GerberToSvg.render(converter, 'id');

    const dom = new JSDOM(svg);
    dom.window.document.querySelector('svg > g').setAttribute('fill', fill);
    dom.window.document.querySelector('svg > g').setAttribute('stroke', fill);
    svg = dom.window.document.querySelector('body').innerHTML;
    return svg;
};

export interface IDrill {
    offset: { x: number, y: number },
    file: string
}

export const convertGerberToPdf = async (gerberFilePaths: string[], outputPath: string, drill?: IDrill) => {
    const doc = new PDFDocument({ size: [ 595, 842 ] });

    doc.pipe(fs.createWriteStream(path.resolve(outputPath, 'output.pdf')));

    const drillSvg = drill && await getSvg(drill.file, '#000');

    let i = 0;
    const width = 170;
    const offset = 100;
    for (let gerberFilePath of gerberFilePaths) {

        const svg = await getSvg(gerberFilePath);

        const leftOffset = (width + offset) * i;

        for (let topOffset of [30, 300, 600]) {
            doc.rect(leftOffset + 30, topOffset, 200, 170)
                .fill('#000');

            SVGtoPDFkit(doc, svg, leftOffset + 35, topOffset + 5);

            if (drillSvg) {
                SVGtoPDFkit(doc, drillSvg, leftOffset + 35 + drill.offset.x, topOffset + 5 + drill.offset.y);
            }
        }

        i++;
    }

    doc.end();
};
