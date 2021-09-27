import Excel from 'exceljs';
import fs from 'fs';
import { concat, from, Observable, of } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { filter, map, mapTo, mergeMap, switchMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { XMLHttpRequest } from 'xmlhttprequest';

const EFFECTIVETIME: number = 20201130;
const MODULEID: string = '45991000052106'; // SE module
const REFSETID_PRO: string = '63461000052102';
const REFSETID_PAT: string = '63451000052100';
const REFSETID_PLURAL: string = '63481000052108';
const REFSETID_ABBR: string = '63491000052105';
const PREFERRED: string = '900000000000548007';

class Refset {
    public name: string;
    public refsetId: string;
    public newDesc: NewDescription[];
    public langRefset: Description[];

    constructor(name: string, refsetId: string) {
        this.name = name;
        this.refsetId = refsetId;
        this.newDesc = [];
        this.langRefset = [];
    }
}

const refsets: Map<string, Refset> = new Map<string, Refset>([
    [ 'pro', new Refset('kontextspecifik', '63461000052102') ],
    [ 'pat', new Refset('patient', '63451000052100') ],
    [ 'plural', new Refset('plural', '63481000052108') ],
    [ 'abbr', new Refset('förkortning', '63491000052105') ],
]);

const sheets: Sheet[] = [
    { sheetName: 'Administreringsväg', startColumn: 3, dose: false },
    { sheetName: 'Administreringsmetod', startColumn: 3, dose: false },
    { sheetName: 'Medicinteknisk produkt ', startColumn: 1, dose: false },
    { sheetName: 'Administreringsställe', startColumn: 1, dose: false },
    { sheetName: 'Precisering av ställe', startColumn: 1, dose: false },
    { sheetName: 'Dosenhet', startColumn: 1, dose: true },
    { sheetName: 'Doseringshastighetsenhet', startColumn: 1, dose: true },
];

const getDescriptions = (sctid: string) => {
    return ajax({
        createXHR: () => {
            return new XMLHttpRequest();
        },
        crossDomain: true,
        headers: {
            'Accept-Language': 'sv',
            'Content-Type': 'application/json',
        },
        method: 'GET',
        url:
        'http://localhost:8080/MAIN%2FSNOMEDCT-SE/descriptions?concept=' + sctid,
    });
};

interface Description {
    descriptionId: string;
    effectiveTime: string;
    conceptId: string;
    lang: string;
    moduleId: string;
    released: boolean;
    releasedEffectiveTime: number;
    term: string;
    type: string;
    typeId: string;
}

interface NewDescription {
    conceptId: string;
    term: string;
}

interface Sheet {
    sheetName: string;
    startColumn: number;
    dose: boolean;
}

const main = () => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile('nll.xlsx').then(() => {

    let mainObservable: any = null;

    sheets.forEach((sheet: Sheet) => {
        const s = workbook.getWorksheet(sheet.sheetName);

        // console.log(admVag.actualRowCount);

        s.eachRow((row: Excel.Row, rowNumber: number) => {
            if (rowNumber > 1) {
                // const edqmId = row.getCell(1).value;
                // const edqmTerm = row.getCell(2).value;
                const sctid: string =
                    row.getCell(sheet.startColumn).value ? row.getCell(sheet.startColumn).value.toString() : '';
                let term: string;
                let patFriend: string;
                let plural: string;
                let abbr: string;

                if (!sheet.dose) {
                    term =
                        row.getCell(sheet.startColumn + 1).value ?
                            row.getCell(sheet.startColumn + 1).value.toString() : '';
                    patFriend =
                        row.getCell(sheet.startColumn + 2).value ?
                            row.getCell(sheet.startColumn + 2).value.toString() : '';
                } else {
                    term =
                        row.getCell(sheet.startColumn + 2).value ?
                            row.getCell(sheet.startColumn + 2).value.toString() : '';
                    patFriend =
                        row.getCell(sheet.startColumn + 5).value ?
                            row.getCell(sheet.startColumn + 5).value.toString() : '';
                    plural =
                        row.getCell(sheet.startColumn + 3).value ?
                            row.getCell(sheet.startColumn + 3).value.toString() : '';
                    abbr =
                        row.getCell(sheet.startColumn + 4).value ?
                            row.getCell(sheet.startColumn + 4).value.toString() : '';
                }

                const obs = getDescriptions(sctid).pipe(
                    map((x: AjaxResponse<any>): Description[] => x.response.items ? x.response.items : []),
                    // map((items: Description[]) => items.filter((item) => item.lang === 'sv')),
                    tap((items: Description[]) => {
                        const existingTerm: Description = items.find((item: Description) => item.term === term);
                        const existingPatFriend: Description =
                            items.find((item: Description) => item.term === patFriend);
                        if (existingTerm) {
                            refsets.get('pro').langRefset.push(existingTerm);
                        } else {
                            refsets.get('pro').newDesc.push({ conceptId: sctid, term });
                        }
                        if (existingPatFriend) {
                            refsets.get('pat').langRefset.push(existingTerm);
                        } else {
                            refsets.get('pat').newDesc.push({ conceptId: sctid, term: patFriend });
                        }
                        if (sheet.dose) {
                            const existingPlural: Description =
                                items.find((item: Description) => item.term === plural);
                            const existingAbbr: Description =
                                items.find((item: Description) => item.term === abbr);
                            if (existingPlural) {
                                refsets.get('plural').langRefset.push(existingPlural);
                            } else {
                                refsets.get('plural').newDesc.push({ conceptId: sctid, term: plural });
                            }
                            if (existingAbbr) {
                                refsets.get('abbr').langRefset.push(existingAbbr);
                            } else {
                                refsets.get('abbr').newDesc.push({ conceptId: sctid, term: abbr });
                            }
                        }
                    }),
                );
                if (mainObservable !== null) {
                    mainObservable = concat(mainObservable, obs);
                } else {
                    mainObservable = obs;
                }
            }
        });
    });

    mainObservable.subscribe(
                    { complete: () => {
                        refsets.forEach((refset: Refset) => {
                            let fd = fs.openSync(refset.name + '_lang_refset.txt', 'w');
                            fs.writeSync(fd, 'id\teffectiveTime\tactive\tmoduleId\trefsetId\t' +
                                'referencedComponentId\tacceptabilityId\n');
                            refset.langRefset.forEach((desc: Description) => {
                                const u = uuid();
                                fs.writeSync(fd, `${u}\t${EFFECTIVETIME}\t1 | t${MODULEID}\t` +
                                    `${refset.refsetId}\t${desc.descriptionId}\t${PREFERRED}\n`);
                            });
                            fs.closeSync(fd);

                            const outputWorkbook = new Excel.Workbook();
                            const outputWorksheet = outputWorkbook.addWorksheet('Description Additions');
                            outputWorksheet.addRow([
                                'Concept ID', 'GB/US FSN Term (For reference only)',
                                'Translated Term', 'Language Code', 'Case significance', 'Type',
                                'Language reference set', 'Acceptability'
                            ]);
                            refset.newDesc.forEach((desc: NewDescription) => {
                                outputWorksheet.addRow([
                                    desc.conceptId, 'Dummy', desc.term, 'sv', 'ci', 'SYNONYM', 'Swedish', 'PREFERRED',
                                ]);
                            });
                            outputWorkbook.xlsx.writeFile(refset.name + '_new_desc.xlsx');

                            /* fd = fs.openSync(refset.name + '_new_desc.txt', 'w');
                            fs.writeSync(fd, 'Concept ID\tGB/US FSN Term (For reference only)\t' +
                                'Translated Term\tLanguage Code\tCase significance\tType\t' +
                                'Language reference set\tAcceptability\n');
                            refset.newDesc.forEach((desc: NewDescription) => {
                                fs.writeSync(fd, `${desc.conceptId}\tDummy\t${desc.term}\tsv\tci\t` +
                                    `SYNONYM\tSwedish\tPREFERRED\n`);
                            });
                            fs.closeSync(fd); */
                        });
                    } },
                );
    });
};

main();
