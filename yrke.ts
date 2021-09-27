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

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = () => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile('Termlista_yrken_201210.xlsx').then(async () => {

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

            for (let i = 0; i < temp.length; i++) {
                const map = temp[i];
                const response = await fetch(
                    'http://localhost:8080/MAIN/SNOMEDCT-SE/MAPTEST1/members',
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
