import { combineLatest, concat, from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { filter, map,
     mergeMap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

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
        url: 'http://localhost:8080/snowstorm/MAIN/concepts/search',
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
                return concat(result, getConcepts({...search, searchAfter: response.searchAfter}));
            }
        }),
    );

};

const getSemanticTag = (fsn: string) => {
    const semtag = fsn.match(/\(([^)]*)\)$/);
    if (semtag !== null) {
        return semtag[1];
    } else {
        return '';
    }
};

const release = process.argv[2];
const ecl = process.argv[3];

const search = {
    activeFilter: true,
    // conceptIds: [
      // 'string',
    // ],
    //definitionStatusFilter: '900000000000073002',
    eclFilter:
        ecl,
    // termFilter: 'string',
};

console.log('Concept ID\tFully specified name\tPreferred term\tCase significance\tSemtag')
getConcepts(search)
    .pipe(
        filter((concept) => concept.pt.lang !== 'sv' &&
            concept.effectiveTime === release),
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
                url: 'http://localhost:8080/snowstorm/MAIN/SNOMEDCT-SE/descriptions?conceptId=' + concept.conceptId,
            }).pipe(map((r) => r.response));
            const en$ = ajax({
                createXHR: () => {
                    return new XMLHttpRequest();
                },
                crossDomain: true,
                headers: {
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json',
                },
                method: 'GET',
                url: 'http://localhost:8080/snowstorm/MAIN/descriptions?conceptId=' + concept.conceptId,
            }).pipe(map((r) => r.response));

            return combineLatest([sv$, en$]).pipe(
                filter(([sv, en]) => sv.total === 0),
                map(([sv, en]) => ({
                        conceptId: concept.conceptId,
                        fsn: en.items.find((d: any) => d.typeId === '900000000000003001' && d.lang === 'en' ),
                        pt: en.items.find((d: any) => d.typeId === '900000000000013009' && 
                            d.acceptabilityMap['900000000000509007'] === 'PREFERRED'),
                    })),
            );
        }),

    )
    .subscribe(
        (x: any) => {
            const fsn = x.fsn.term;
            const semtag = getSemanticTag(x.fsn.term);
            const cs = x.pt.caseSignificance === 'CASE_INSENSITIVE' ?
                'ci' :
                (x.pt.caseSignificance === 'ENTIRE_TERM_CASE_SENSITIVE' ? 'CS' : 'cI');
            console.log(`${x.conceptId}\t${fsn}\t${x.pt.term}\t${cs}\t${semtag}`)
        },
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
