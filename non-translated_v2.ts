import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, groupBy, map,
    mergeMap, reduce, take } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';
import { combineIngredients, translate } from './translate_medicinal';

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
                // return result;
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
    definitionStatusFilter: '900000000000073002', // fully defined
    eclFilter:
        '<763158003 | Medicinal product (product) |',
    // termFilter: 'actuation',
};

/*
console.log(combineIngredients([
    // vaccin som endast innehåller , ,  och antigen från Neisseria meningitidis, grupp Y
    {term: 'antigen från Neisseria meningitidis W-135', caseSignificance: 'CASE_INSENSITIVE'},
    {term: 'antigen från Neisseria meningitidis grupp A', caseSignificance: 'CASE_INSENSITIVE'},
    {term: 'antigen från Neisseria meningitidis grupp C', caseSignificance: 'CASE_INSENSITIVE'},
    {term: 'antigen från Neisseria meningitidis, grupp Y', caseSignificance: 'CASE_INSENSITIVE'}
], 'CASE_INSENSITIVE')); */
console.log('Concept ID\tGB/US FSN Term (For reference only)\tPreferred Term (For reference only)\tTranslated Term\tLanguage Code\tCase significance\tType\tLanguage reference set\tAcceptability\tLanguage reference set\tAcceptability\tLanguage reference set\tAcceptability\tNotes');

getConcepts(search)
    .pipe(
        filter((concept) => concept.pt.lang !== 'sv' &&
            concept.effectiveTime === '20210131'),
<<<<<<< HEAD
	// take(5),
=======
        take(5),
>>>>>>> f93cdeb957c5a62836e3375c21a76e60edfdc59b
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
                url: `http://localhost:8080/MAIN/relationships?active=true&source=${concept.conceptId}`
                    + '&characteristicType=INFERRED_RELATIONSHIP',
            }).pipe(
                mergeMap((result: any) => from(result.response.items)),
                // tap(console.log),
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
<<<<<<< HEAD
                        url: 'http://localhost:8080/snowstorm/MAIN/SNOMEDCT-SE/descriptions?conceptId='
=======
                        url: 'http://localhost:8080/MAIN/SNOMEDCT-SE/descriptions?concept='
>>>>>>> f93cdeb957c5a62836e3375c21a76e60edfdc59b
                            + relationship.destinationId,
                    }).pipe(
                        map((result) => {
                            const descArr = result.response.items.filter((d: any) => d.lang === 'sv' &&
                                d.type === 'SYNONYM' && d.acceptabilityMap['46011000052107'] === 'PREFERRED');
                            if (descArr.length == 0) {
				const missing = `översättning saknas: ${relationship.destinationId} | ${relationship.target.fsn.term} |`;
				//console.log(missing);
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
                }),

            );
        }),
        groupBy((relationship) => relationship.sourceId),
        mergeMap((concept$) => concept$.pipe(reduce((acc, cur) => [...acc, cur], [concept$.key]))),
        map((arr) => ({ conceptId: arr[0], fsn: arr[1].sourceFSN, relationships: arr.slice(1) })),
        map((concept) => {
	    // console.log(JSON.stringify(concept));
            return translate(concept);
        }),
    )
    .subscribe(
        (x: any) => {
		const cs = (x.caseSignificance === 'CASE_INSENSITIVE') ? 'ci' : (x.caseSignificance === 'INITIAL_CHARACTER_CASE_INSENSITIVE') ? 'cI' : 'CS';
		console.log(`${x.conceptId}\t${x.fsn}\t${x.fsn}\t${x.term}\tsv\t${cs}\tSYNONYM\tSwedish\tPREFERRED`);
	},
        (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        // () => console.log('Completed'),
    );
