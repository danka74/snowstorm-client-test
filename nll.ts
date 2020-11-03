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
const PREFERRED: string = '900000000000548007';

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
}

const main = () => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile('nll.xlsx').then(() => {

    const sheets: Sheet[] = [
        { sheetName: 'Administreringsväg', startColumn: 3 },
        { sheetName: 'Administreringsmetod', startColumn: 3 },
        { sheetName: 'Medicinteknisk produkt ', startColumn: 1 },
        { sheetName: 'Administreringsställe', startColumn: 1 },
        { sheetName: 'Precisering av ställe', startColumn: 1 },
    ];

    const newProDesc: NewDescription[] = [];
    const newPatDesc: NewDescription[] = [];
    const proLangRefset: Description[] = [];
    const patLangRefset: Description[] = [];

    let mainObservable: any = null;

    sheets.forEach((sheet: Sheet) => {
        const admVag = workbook.getWorksheet(sheet.sheetName);

        // console.log(admVag.actualRowCount);

        admVag.eachRow((row: Excel.Row, rowNumber: number) => {
            if (rowNumber > 1) {
                // const edqmId = row.getCell(1).value;
                // const edqmTerm = row.getCell(2).value;
                const sctid: string = row.getCell(3).value ? row.getCell(sheet.startColumn).value.toString() : '';
                const term: string = row.getCell(4).value ? row.getCell(sheet.startColumn + 1).value.toString() : '';
                const patFriend: string =
                    row.getCell(5).value ? row.getCell(sheet.startColumn + 2).value.toString() : '';
                // console.log(`${sctid}. ${term}. ${patFriend}`);

                const obs = getDescriptions(sctid).pipe(
                    map((x: AjaxResponse): Description[] => x.response.items ? x.response.items : []),
                    tap((items: Description[]) => {
                        const existingTerm: Description = items.find((item: Description) => item.term === term);
                        const existingPatFriend: Description =
                            items.find((item: Description) => item.term === patFriend);
                        if (existingTerm) {
                            proLangRefset.push(existingTerm);
                        } else {
                            newProDesc.push({ conceptId: sctid, term });
                        }
                        if (existingPatFriend) {
                            patLangRefset.push(existingTerm);
                        } else {
                            newPatDesc.push({ conceptId: sctid, term: patFriend });
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
                        let fd = fs.openSync('proLangRefset.txt', 'w');
                        fs.writeSync(fd, 'id\teffectiveTime\tactive\tmoduleId\trefsetId\t' +
                            'referencedComponentId\tacceptabilityId\n');
                        proLangRefset.forEach((desc: Description) => {
                            const u = uuid();
                            fs.writeSync(fd, `${u}\t${EFFECTIVETIME}\t1\t${MODULEID}\t` +
                                `${REFSETID_PRO}\t${desc.descriptionId}\t${PREFERRED}\n`);
                        });
                        fs.closeSync(fd);

                        fd = fs.openSync('patLangRefset.txt', 'w');
                        fs.writeSync(fd, 'id\teffectiveTime\tactive\tmoduleId\trefsetId\t' +
                            'referencedComponentId\tacceptabilityId\n');
                        patLangRefset.forEach((desc: Description) => {
                            const u = uuid();
                            fs.writeSync(fd, `${u}\t${EFFECTIVETIME}\t1\t${MODULEID}\t` +
                                `${REFSETID_PAT}\t${desc.descriptionId}\t${PREFERRED}\n`);
                        });
                        fs.closeSync(fd);

                        fd = fs.openSync('newDescPro.txt', 'w');
                        fs.writeSync(fd, 'Concept ID\tGB/US FSN Term (For reference only)\t' +
                            'Translated Term\tLanguage Code\tCase significance\tType\t' +
                            'Language reference set\tAcceptability\n');
                        newProDesc.forEach((desc: NewDescription) => {
                            const u = uuid();
                            fs.writeSync(fd, `${desc.conceptId}\tDummy\t${desc.term}\tsv\tci\tSwedish\tPREFERRED\n`);
                        });
                        fs.closeSync(fd);

                        fd = fs.openSync('newDescPat.txt', 'w');
                        fs.writeSync(fd, 'Concept ID\tGB/US FSN Term (For reference only)\t' +
                            'Translated Term\tLanguage Code\tCase significance\tType\t' +
                            'Language reference set\tAcceptability\n');
                        newPatDesc.forEach((desc: NewDescription) => {
                            const u = uuid();
                            fs.writeSync(fd, `${desc.conceptId}\tDummy\t${desc.term}\tsv\tci\tSwedish\tPREFERRED\n`);
                        });
                        fs.closeSync(fd);
                    } },
                );
    });
};

main();
