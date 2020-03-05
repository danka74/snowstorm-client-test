import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, tap, take, groupBy } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';
import { translate } from './translate_medicinal';

const MAX_PAGE_SIZE = 10000;

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
        url: 'http://localhost:8080/MAIN%2FSNOMEDCT-SE/concepts/search',
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
                return result.pipe(
                    concat(getConcepts({...search, searchAfter: response.searchAfter})),
                );
            }
        }),
    );

};

const search = {
    activeFilter: true,
    // conceptIds: [
      // 'string',
    // ],
    definitionStatusFilter: '900000000000073002',
    eclFilter:
        '<<763158003 | Medicinal product (product) |',
    // termFilter: 'string',
};

getConcepts(search)
    .pipe(
        filter((concept) => concept.pt.lang !== 'sv' &&
            concept.effectiveTime === '20200131'),
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
                url: `http://localhost:8080/MAIN%2FSNOMEDCT-SE/relationships?active=true&source=${concept.conceptId}`
                    + '&characteristicType=INFERRED_RELATIONSHIP',
            }).pipe(
                mergeMap((result: any) => from(result.response.items)),
                filter((relationship: any) => relationship.typeId !== '116680003'), // filter out Is A
                mergeMap((relationship: any) => {
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
                        url: 'http://localhost:8080/MAIN%2FSNOMEDCT-SE/descriptions?concept='
                            + relationship.destinationId,
                    }).pipe(
                        map((result) => {
                            const descArr = result.response.items.filter((d: any) => d.lang === 'sv' &&
                                d.type === 'SYNONYM' && d.acceptabilityMap['46011000052107'] === 'PREFERRED');
                            if (descArr.length == 0) {
                                return ({
                                    term: 'översättning saknas: ' + relationship.destinationId,
                                });
                            }
                            return descArr[0]; // should be only one preferred term
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
                }),

            );
        }),
        groupBy((relationship) => relationship.sourceId),
        mergeMap((concept$) => concept$.pipe(reduce((acc, cur) => [...acc, cur], [concept$.key]))),
        map((arr) => ({ conceptId: arr[0], fsn: arr[1].sourceFSN, relationships: arr.slice(1) })),
        map((concept) => translate(concept)),
    )
    .subscribe(
        (x: any) => console.log(`${x.conceptId}\t${x.fsn}\t${x.term}\t${x.caseSignificance}`),
        // (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        // () => console.log('Completed'),
    );

/*
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
        url: 'http://localhost:8080/MAIN%2FSNOMEDCT-SE/descriptions/concept=' + rel.destinationId,
    } */
