import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, take, tap } from 'rxjs/operators';
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
            'Accept-Language': 'sv',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        url: 'http://localhost:8080/MAIN/SNOMEDCT-SE/concepts/search',
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
    statedEclFilter:
        '* : [0..0] * = *',
    // termFilter: 'string',
};

getConcepts(search)
    .pipe(
        filter((concept) => concept.moduleId === '45991000052106'),
        take(100),
        // mapTo(1),
        // reduce((tot: number, val: any) => tot + val, 0),
    )
    .subscribe(
        (x: any) => {
            return console.log(x.conceptId + '\t' + x.fsn.term + '\t' + x.pt.term);
        },
        (error: any) => {
            return console.log('Error: ' + JSON.stringify(error));
        },
        () => {
            // return console.log('Completed');
        },
    );
