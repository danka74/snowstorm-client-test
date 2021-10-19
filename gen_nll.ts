import Excel from 'exceljs';
import { from, Observable } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const langRefsetMap = new Map<string, string>([
    ['63461000052102', 'Term'],
    ['63451000052100', 'Patientvänlig synonym'],
    ['63491000052105', 'Förkortning'],
    ['63481000052108', 'Plural'],
]);

const sheets = new Map<string, any>([
    ['62151000052104',
    {
        refset: 'Administreringsväg',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    ['62161000052101',
    {
        refset: 'Administreringsmetod',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    [ '62181000052107', {
        refset: 'Administreringsställe',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    ['62191000052109', {
        refset: 'Precisering administreringsställe',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    ['62171000052105', {
        refset: 'Medicinteknisk produkt använd för administrering',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    ['62201000052106', {
        refset: 'Dosenhet',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63481000052108', // | språkurval dosenhet plural, nationella läkemedelslistan |
            '63491000052105', // | språkurval dosenhet förkortning, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
    ['66831000052100', {
        refset: 'Doseringshastighetsenhet',
        langRefsets: [
            '63461000052102', // | språkurval kontextspecifika termer, nationella läkemedelslistan |
            '63481000052108', // | språkurval dosenhet plural, nationella läkemedelslistan |
            '63491000052105', // | språkurval dosenhet förkortning, nationella läkemedelslistan |
            '63451000052100', // | språkurval allmänspråkliga uttryck, nationella läkemedelslistan |
        ],
    }],
]);

const host = process.argv[2];
const branch = process.argv[3];

const workbook = new Excel.Workbook();

const result = new Map<string, string[][]>();

const main = () => {
    let completed: number = 0;
    from(sheets).subscribe((refset) => {
        result.set(refset[0], []);
        ajax({
            createXHR: () => {
                return new XMLHttpRequest();
            },
            crossDomain: true,
            headers: {
                'Accept-Language': 'sv',
                'Content-Type': 'application/json',
            },
            method: 'GET',
            url: host + '/' + branch + '/members?active=true&offset=0&limit=500&referenceSet='
                + refset[0],
        }).pipe(
            mergeMap((r: any) => from(r.response.items)),
            mergeMap((member: any) => {
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
                    url: host + '/' + branch + '/descriptions?offset=0&limit=500&conceptId='
                        + member.referencedComponentId,
                }).pipe(
                    map((r: any) => ({
                        conceptId: member.referencedComponentId,
                        descriptions: r.response.items,
                    })),
                );
            }),
        ).subscribe((x: {conceptId: string, descriptions: any[]}) => {
            if (!result.get(refset[0]).find((r: string[]) => r[0] === x.conceptId)) {
                const row = [x.conceptId];
                refset[1].langRefsets.forEach((lr: string) => {
                    const term = x.descriptions.find((d) => {
                        const accept = d.acceptabilityMap[lr];
                        return (accept === 'PREFERRED');
                    });
                    if (term === undefined) {
                        row.push('Saknas!');
                    } else {
                        row.push(term.term);
                    }
                });
                result.get(refset[0]).push(row);
                console.log(row);
            }
        },
        (error: any) => {
            console.log('Error');
        },
        () => {
            console.log('Complete');
            completed++;
            // when last sheet is completed
            if (completed === sheets.size) {
                result.forEach((sheet, key) => {
                    const excelSheet = workbook.addWorksheet(sheets.get(key).refset);
                    // add heading row
                    const langRefsets = ['Snomed CT kod'];
                    sheets.get(key).langRefsets.forEach((id: string) => {
                        langRefsets.push(langRefsetMap.get(id));
                    });
                    excelSheet.addRow(langRefsets).font = { bold: true };
                    sheet.sort((a, b) => a[1].localeCompare(b[1], 'sv'));
                    sheet.forEach((r: string[]) => excelSheet.addRow(r));
                });
                workbook.xlsx.writeFile('filename.xlsx');
            }
        });
    },
    (error: any) => {
        console.log('Error!');
    });
};

main();
