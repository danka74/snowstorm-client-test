"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const ajax_1 = require("rxjs/ajax");
const operators_1 = require("rxjs/operators");
const xmlhttprequest_1 = require("xmlhttprequest");
const MAX_PAGE_SIZE = 10000;
const getPage = (search) => {
    search.limit = MAX_PAGE_SIZE;
    return ajax_1.ajax({
        body: search,
        createXHR: () => {
            return new xmlhttprequest_1.XMLHttpRequest();
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
    operators_1.map((r) => r.response));
};
const getConcepts = (search) => {
    return getPage(search).pipe(
    // tap(console.log),
    operators_1.mergeMap((response) => {
        const result = rxjs_1.from(response.items);
        if (response.items.length < response.limit) {
            return result;
        }
        else {
            return result.pipe(operators_1.concat(getConcepts(Object.assign({}, search, { searchAfter: response.searchAfter }))));
        }
    }));
};
const search = {
    activeFilter: true,
    // conceptIds: [
    // 'string',
    // ],
    // definitionStatusFilter: 'string',
    eclFilter: '<< 363679005 |bilddiagnostik|',
};
getConcepts(search)
    .pipe(operators_1.filter((concept) => concept.pt.lang === 'sv'))
    .subscribe((x) => {
    return console.log(x.conceptId + '\t' + x.fsn.term + '\t' + x.pt.term);
}, (error) => {
    return console.log('Error: ' + JSON.stringify(error));
}, () => {
    // return console.log('Completed');
});
//# sourceMappingURL=bild.js.map