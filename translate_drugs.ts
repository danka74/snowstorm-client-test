import { from, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, groupBy, map,
    mergeMap, reduce, take, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';
import { translate } from './translate_medicinal';

const MAX_PAGE_SIZE = 10000;

const host = process.argv[2].endsWith('/') ? process.argv[2].replace(/\/$/i, '') : process.argv[2];
const release = process.argv[3];

const getPage = (search: any) => {
    search.limit = MAX_PAGE_SIZE;
    return ajax({
        body: search,
        createXHR: () => {
            return new XMLHttpRequest();
        },
        crossDomain: true,
        headers: {
            'Accept-Language': 'sv',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        url: host + '/MAIN/concepts/search',
    }).pipe(
//        tap(console.log),
        map((r) => r.response),
    );
};

const getConcepts = (search: any): Observable<any> => {
    return getPage(search).pipe(
        // tap(console.log),
        mergeMap((response: any) => {
            const result: Observable<any> = from(response.items);
            if (response.items.length < response.limit) {
                return result;
            } else {
                // return result;
                return result.pipe(
                    concat(getConcepts({...search, searchAfter: response.searchAfter})),
                );
            }
        }),
    );

};

const searchSpec = {
    activeFilter: true,
    definitionStatusFilter: '900000000000073002', // fully defined
    ecl: '<763158003 | Medicinal product (product) |',
};

console.log('Concept ID\tGB/US FSN Term (For reference only)\tPreferred Term (For reference only)\tTranslated Term\tLanguage Code\tCase significance\tType\tLanguage reference set\tAcceptability\tLanguage reference set\tAcceptability\tLanguage reference set\tAcceptability\tNotes');

getConcepts(searchSpec)
    .pipe(
        filter((concept) => concept.pt.lang !== 'sv' &&
            concept.effectiveTime > release),
        // take(5),
        // tap(console.log),
        mergeMap((concept) => {
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
                url: host + `/MAIN/relationships?active=true&source=${concept.conceptId}`
                    + '&characteristicType=INFERRED_RELATIONSHIP',
            }).pipe(
                mergeMap((result: any) => from(result.response.items)),
                // tap(console.log),
                filter((relationship: any) => relationship.typeId !== '116680003'), // filter out Is A
                mergeMap((relationship: any) => {
                    if (relationship.concreteValue) {
                        return of({
                            caseSignificance: 'CASE_INSENSITIVE',
                            destinationId: relationship.destinationId,
                            groupId: relationship.groupId,
                            sourceFSN: concept.fsn.term,
                            sourceId: relationship.sourceId,
                            term: relationship.concreteValue.value,
                            typeId: relationship.typeId,
                        });
                    } else {
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
                            url: host + '/MAIN/SNOMEDCT-SE/descriptions?conceptId='
                                + relationship.destinationId,
                        }).pipe(
                            map((result: any) => {
                                const descArr = result.response.items.filter((d: any) => d.lang === 'sv' &&
                                    d.type === 'SYNONYM' && d.acceptabilityMap['46011000052107'] === 'PREFERRED');
                                if (descArr.length === 0) {
                                    const missing = `översättning saknas: ${relationship.destinationId} | ${relationship.target.fsn.term} |`;
                                    // console.log(missing);
                                    return ({
                                        term: missing,
                                    });
                                }
                                if (descArr[0].active !== true) {
                                    console.log(descArr[0]);
                                }

                                return descArr[0]; // should be only one preferred term per lanugage
                            }),
                            map((description) => ({
                                caseSignificance: description.caseSignificance,
                                destinationId: relationship.destinationId,
                                groupId: relationship.groupId,
                                sourceFSN: concept.fsn.term,
                                sourceId: relationship.sourceId,
                                term: description.term,
                                typeId: relationship.typeId,
                            })),
                        );
                    }
                }),

            );
        }),
        // tap(console.log),
        groupBy((relationship) => relationship.sourceId),
        mergeMap((concept$) => concept$.pipe(reduce((acc, cur) => [...acc, cur], [concept$.key]))),
        map((arr: any[]) => ({ conceptId: arr[0], fsn: arr[1].sourceFSN, relationships: arr.slice(1) })),
        map((concept) => {
            // console.log(concept);
            return translate(concept);
        }),
    )
    .subscribe(
        (x: any) => {
            const cs = (x.caseSignificance === 'CASE_INSENSITIVE') ? 'ci' : (x.caseSignificance === 'INITIAL_CHARACTER_CASE_INSENSITIVE') ? 'cI' : 'CS';
            console.log(`${x.conceptId}\t${x.fsn}\t${x.fsn}\t${x.term}\tsv\t${cs}\tSYNONYM\tSwedish\tPREFERRED`);
        },
        // (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        // () => console.log('Completed'),
    );
