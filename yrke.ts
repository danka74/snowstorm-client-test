import Excel from 'exceljs';
import fetch from 'node-fetch';
import { XMLHttpRequest } from 'xmlhttprequest';

const EFFECTIVETIME: number = 20201130;
const MODULEID: string = '45991000052106'; // SE module
const PREFERRED: string = '900000000000548007';

const sheets: Sheet[] = [
    { sheetName: 'Yrken, totallista', startColumn: 6 },
];

interface Sheet {
    sheetName: string;
    startColumn: number;
}

if (process.argv.length < 4) {
    console.error('Usage: node yrke.js <host> <branch> <input>');
    process.exit(1);
}

const host = process.argv[2];
const branch = process.argv[3];
const inputFile = process.argv[4];
if (host.endsWith('/')) {
    host.replace(/\/$/, '');
}
if (branch.endsWith('/')) {
    branch.replace(/\/$/, '');
}

const main = () => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile(inputFile).then(async () => {

        sheets.forEach(async (sheet: Sheet) => {
            const s = workbook.getWorksheet(sheet.sheetName);

            // console.log(admVag.actualRowCount);

            const temp: object[] = [];

            s.eachRow((row: Excel.Row, rowNumber: number) => {
                if (rowNumber > 1) {

                    const sctExpression: string =
                        row.getCell(sheet.startColumn).value ? row.getCell(sheet.startColumn).value.toString() : '';
                    const sctid: string = sctExpression.substr(0, sctExpression.indexOf('|')).trim();

                    const SOSNYKCode: string =
                        row.getCell(sheet.startColumn + 1).value ? row.getCell(sheet.startColumn + 1).value.toString() : '';
                    const AIDCode: string =
                        row.getCell(sheet.startColumn + 3).value ? row.getCell(sheet.startColumn + 3).value.toString() : '';

                    const mapMember = {
                        active: true,
                        additionalFields: {
                            mapTarget: AIDCode,

                        },
                        moduleId: MODULEID,
                        referencedComponentId: sctid,
                        refsetId: 1234567891,
                    };

                    temp.push(mapMember);
                }
            });

            // old-style for loop is required for synchronuous fetch calls
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < temp.length; i++) {
                const map = temp[i];
                const response = await fetch(
                    host + '/' + branch + '/members',
                    {
                        body: JSON.stringify(map),
                        headers: {
                            'Accept-Language': 'sv',
                            'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        redirect: 'follow',
                    },
                ).catch((error) => {
                    console.error(error);
                });

                console.log(response);
            }
        });
    });
};

main();
