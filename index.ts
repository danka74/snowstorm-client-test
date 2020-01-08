import { ajax } from 'rxjs/ajax';
import { from, Observable } from 'rxjs';
import { concat, filter, map, mapTo, mergeMap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const getPage = (index: number) => { return ajax({
        createXHR: () => {
            return new XMLHttpRequest();
        },
        crossDomain: true,
        headers: {
            'Accept-Language': 'sv',
            'Content-Type': 'application/json',
        },
        method: 'GET',
        url: 'http://localhost:8080/MAIN%2FSNOMEDCT-SE/concepts/195967001/descendants?stated=false&offset='
            + index || 0 + '&limit=50',
    }).pipe(
//        tap(console.log),
        map((r) => r.response),
    );
};

const getConcepts = (index: number): Observable<any> => {
    return getPage(index).pipe(
//        tap(console.log),
        mergeMap((response: any) => {
            const result: Observable<any> = from(response.items);
            if (response.total - response.offset <= response.limit) {
                return result;
            } else {
                return result.pipe(
                    concat(getConcepts(response.offset + response.limit)),
                );
            }
        }),
    );

};

getConcepts(0)
    .pipe(
        filter((concept) => concept.definitionStatus === 'FULLY_DEFINED'),
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
                url: 'http://localhost:8080/browser/MAIN%2FSNOMEDCT-SE/concepts/'
                    + concept.conceptId,
            }).pipe(
            //    tap((r) => console.log(r.response)),
                map((r) => r.response),
            );
        }),
        map((concept) => concept.relationships.filter((rel: any) => rel.active === true)),
        // mapTo(1),
        // reduce((tot: number, val: any) => tot + val, 0),
    )
    .subscribe(
        (x: any) => console.log('JSON: ' + JSON.stringify(x)),
        (error: any) => console.log ('Error: ' + error),
        () => console.log('Completed'),
    );
