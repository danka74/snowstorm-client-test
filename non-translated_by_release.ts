import { combineLatest, from, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, groupBy, map,
    mergeMap, reduce, take, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const MAX_PAGE_SIZE = 10000;

const getPage = (s: any) => {
    s.limit = MAX_PAGE_SIZE;
    return ajax({
        body: s,
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

const getConcepts = (s: any): Observable<any> => {
    return getPage(s).pipe(
        // tap(console.log),
        mergeMap((response: any) => {
            const result: Observable<any> = from(response.items);
            if (response.items.length < response.limit) {
                return result;
            } else {
                // return result;
                return result.pipe(
                    concat(getConcepts({...s, searchAfter: response.searchAfter})),
                );
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

if (process.argv.length !== 5) {
    console.error('Usage: non-translated_by_release <host> <prev. release> <ecl>');
    process.exit(1);
}

const host = process.argv[2].endsWith('/') ? process.argv[2].replace(/\/$/i, '') : process.argv[2];
const release = process.argv[3];
const ecl = process.argv[4];

const search = {
    activeFilter: true,
    eclFilter:
        ecl,
};

console.log('Concept ID\tFully specified name\tPreferred term\tCase significance\tSemtag');
getConcepts(search)
    .pipe(
        filter((concept) => {
            return concept.effectiveTime > release;
        }),
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
                url: host + '/MAIN/SNOMEDCT-SE/descriptions?conceptId=' + concept.id,
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
                url: 'http://localhost:8080/snowstorm/snomed-ct/MAIN/descriptions?conceptId=' + concept.id,
            }).pipe(map((r) => r.response));

            return combineLatest([sv$, en$]).pipe(
                filter(([sv, en]: [any, any]) => {
                    const found = sv.items.find((d: any) => d.lang === 'sv');
                    return found === undefined;
                }),
                map(([sv, en]) => ({
                        conceptId: concept.id,
                        fsn: en.items.find((d: any) =>
                            d.active === true && d.typeId === '900000000000003001' && d.lang === 'en' ),
                        pt: en.items.find((d: any) =>
                            d.active === true && d.typeId === '900000000000013009' && d.lang === 'en' &&
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
            console.log(`${x.conceptId}\t${fsn}\t${x.pt.term}\t${cs}\t${semtag}`);
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
