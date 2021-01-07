import { combineLatest, from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, tap, take } from 'rxjs/operators';
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
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        url: 'http://localhost:8080/MAIN/concepts/search',
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
            concept.effectiveTime === '20210131'),
        // tap(console.log),
        mergeMap((concept) => {
            const sv$ = ajax({
                createXHR: () => {
                    return new XMLHttpRequest();
                },
                crossDomain: true,
                headers: {
                    'Accept-Language': 'sv',
                    'Content-Type': 'application/json',
                },
                method: 'GET',
                url: 'http://localhost:8080/MAIN/SNOMEDCT-SE/descriptions?conceptId=' + concept.conceptId,
            }).pipe(map((r) => r.response));
            const en$ = ajax({
                createXHR: () => {
                    return new XMLHttpRequest();
                },
                crossDomain: true,
                headers: {
                    'Accept-Language': 'sv',
                    'Content-Type': 'application/json',
                },
                method: 'GET',
                url: 'http://localhost:8080/MAIN/descriptions?conceptId=' + concept.conceptId,
            }).pipe(map((r) => r.response));

            return combineLatest(sv$, en$).pipe(
                filter(([sv, en]) => sv.total === 0),
                map(([sv, en]) => ({
                        conceptId: concept.conceptId,
                        fsn: en.items.find((d: any) => d.typeId === '900000000000003001' && d.lang === 'en' ),
                        pt: en.items.find((d: any) => d.typeId === '900000000000013009' && d.acceptabilityMap['900000000000509007'] === 'PREFERRED'),
                    })),
            )
        }),

    )
    .subscribe(
        (x: any) => console.log(`${x.conceptId}\t${x.fsn}\t${x.term}\t${x.caseSignificanceId}`),
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
