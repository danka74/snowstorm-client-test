"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajax_1 = require("rxjs/ajax");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const xmlhttprequest_1 = require("xmlhttprequest");
const getPage = (index) => {
    return ajax_1.ajax({
        createXHR: () => {
            return new xmlhttprequest_1.XMLHttpRequest();
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
    operators_1.map((r) => r.response));
};
const getConcepts = (index) => {
    return getPage(index).pipe(
    //        tap(console.log),
    operators_1.mergeMap((response) => {
        const result = rxjs_1.from(response.items);
        if (response.total - response.offset <= response.limit) {
            return result;
        }
        else {
            return result.pipe(operators_1.concat(getConcepts(response.offset + response.limit)));
        }
    }));
};
getConcepts(0)
    .pipe(operators_1.filter((concept) => concept.definitionStatus === 'FULLY_DEFINED'), 
// tap(console.log),
operators_1.mergeMap((concept) => {
    return ajax_1.ajax({
        createXHR: () => {
            return new xmlhttprequest_1.XMLHttpRequest();
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
    operators_1.map((r) => r.response));
}), operators_1.map((concept) => concept.relationships.filter((rel) => rel.active === true)))
    .subscribe((x) => console.log('JSON: ' + JSON.stringify(x)), (error) => console.log('Error: ' + error), () => console.log('Completed'));
//# sourceMappingURL=index.js.map