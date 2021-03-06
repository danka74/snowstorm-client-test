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

            s.eachRow(async (row: Excel.Row, rowNumber: number) => {
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
                            mapTarget: SOSNYKCode,

                        },
                        moduleId: MODULEID,
                        referencedComponentId: sctid,
                        refsetId: 1234567890,
                    };

                    const response = await fetch(
                        'http://localhost:8080/MAIN/SNOMEDCT-SE/MAPTEST1/members',
                        {
                            method: 'POST',
                            headers: {
                                'Accept-Language': 'sv',
                                'Content-Type': 'application/json',
                            },
                            redirect: 'follow',
                            body: JSON.stringify(mapMember),
                        },
                    ).catch((error) => {
                        console.error(error);
                    }).then((data) => {
                        console.log(data);
                    });

                    await sleep(10000);
                }
            });
        });
    });
};

main();
