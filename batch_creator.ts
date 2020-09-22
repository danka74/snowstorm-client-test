import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, delay, filter, map,
    mapTo, mergeMap, reduce, switchMap, tap, take, groupBy } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';
import { translate } from './translate_medicinal';

const MAX_PAGE_SIZE = 10000;

const HOST = 'http://localhost:8080/';
const BRANCH = 'MAIN/SNOMEDCT-SE';

interface Description {
    active: boolean;
    released: boolean;
    releasedEffectiveTime: string;
    descriptionId: string;
    term: string;
    conceptId: string;
    moduleId: string;
    typeId: string;
    acceptabilityMap: {
         [key: string]: string;
    };
    type: string;
    caseSignificance: string;
    lang: string;
    effectiveTime: string;
}

interface DescriptionItem {
    conceptId: string;
    descriptions: Description[];
    fsn: string;
}

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
        url: HOST + BRANCH + '/concepts/search',
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
    // definitionStatusFilter: '900000000000073002',
    eclFilter:
        '<33879002 | aktiv immunisering |',
    // termFilter: 'actuation',
};

console.log('Concept ID\tGB/US FSN Term (For reference only)\tTranslated Term\tLanguage Code\t' +
                'Case significance\tType\tLanguage reference set\tAcceptability');

getConcepts(search)
    .pipe(
        // take(2),
        // filter((concept) => // concept.pt.lang !== 'sv' &&
        //    concept.effectiveTime === '20190731'),
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
                url: HOST + BRANCH + `/descriptions?active=true&concept=${concept.conceptId}`,
            }).pipe(
                map((x: any) => ({
                    conceptId: concept.conceptId,
                    descriptions: x.response.items.filter((desc: Description) => desc.active === true),
                    fsn: concept.fsn.term,
                })),
            );
        }),
    )
    .subscribe(
        (item: DescriptionItem) => {
            // item.descriptions.forEach((desc) => console.log(`${desc.type}: ${desc.lang} - ${desc.term}`));
            if (item.descriptions.find((d) => d.lang === 'en' && d.term.match(/Administration of/)) &&
                item.descriptions.find((d) => d.lang === 'sv' && d.term.match(/administrering av vaccin/)) &&
                !item.descriptions.find((d) => d.lang === 'sv' && d.term.match(/vaccination/))) {
                const desc = item.descriptions.find((d) => d.lang === 'sv' && d.term.match(/administrering av/));
                const newTerm = desc.term.replace('administrering av vaccin', 'vaccination');
                const newCaseSignificance = desc.caseSignificance === 'CASE_INSENSITIVE' ? 'ci' : 
                    (desc.caseSignificance === 'CASE_SENSITIVE' ? 'CS' : 'cI');
                console.log(`${item.conceptId}\t${item.fsn}\t${newTerm}\tsv\t${newCaseSignificance}\tSYNONYM\tSwedish\tACCEPTABLE`);
            }
        },
        (error: any) => console.log ('Error: ' + JSON.stringify(error)),
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
