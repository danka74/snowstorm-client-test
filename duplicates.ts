import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, tap, scan } from 'rxjs/operators';
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
    // definitionStatusFilter: 'string',
    eclFilter:
        '<<123037004 | Body structure (body structure) |',
    // termFilter: 'string',
};

const getSemanticTag = (term: string) => {
    const start = term.lastIndexOf('(');
    const end = term.lastIndexOf(')');
    if (start === -1 || end === -1) {
        return null;
    }
    return term.slice(start + 1, end);
};

getConcepts(search)
    .pipe(
        filter((concept) => concept.pt.lang === 'sv'),
        // TODO: Set.prototype.has equality comparison is not customizable! A Map instead?
        map((concept) => concept.pt.term + ':' + getSemanticTag(concept.fsn.term)),
        reduce(([ dup, uniq ], next) => {
                if (uniq.has(next)) {
                    return [ dup.add(next), uniq ];
                } else {
                    return [ dup, uniq.add(next)];
                }
            },
            [ new Set<string>(), new Set<string>() ]),
        map(([ dup, uniq ]) => Array.from(dup)),
    )
    .subscribe(
        (x: any) => console.log('JSON: ' + JSON.stringify(x)),
        (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        () => console.log('Completed'),
    );
