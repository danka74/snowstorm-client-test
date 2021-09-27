import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, groupBy, map,
    mergeMap, reduce, tap } from 'rxjs/operators';
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
    definitionStatusFilter: '900000000000073002',
    eclFilter: `
    <<386053000 | Evaluation procedure (procedure) |:
        116686009 |Has specimen (attribute)| = 119364003 | Serum specimen (specimen) |,
        246093002 |Component (attribute)| = <105590001 | Substance (substance) |
    `,
};

console.log(`Prefix(owl:=<http://www.w3.org/2002/07/owl#>)
Prefix(rdf:=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>)
Prefix(xml:=<http://www.w3.org/XML/1998/namespace>)
Prefix(xsd:=<http://www.w3.org/2001/XMLSchema#>)
Prefix(rdfs:=<http://www.w3.org/2000/01/rdf-schema#>)

Ontology(<http://snomed.info/e2o-test>
`);

getConcepts(search)
    .pipe(
        // tap(console.log),
        mergeMap((concept) => {
            return ajax({
                createXHR: () => {
                    return new XMLHttpRequest();
                },
                crossDomain: true,
                headers: {
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json',
                },
                method: 'GET',
                url: `http://localhost:8080/MAIN/relationships?active=true&source=${concept.conceptId}`
                    + '&characteristicType=INFERRED_RELATIONSHIP',
            }).pipe(
                mergeMap((result: any) => from(result.response.items)),
                filter((relationship: any) => relationship.typeId !== '116680003'), // filter out Is A
            );
        }),
        groupBy((relationship) => relationship.sourceId),
        mergeMap((concept$) => concept$.pipe(reduce((acc, cur) => [...acc, cur], [concept$.key]))),
        map((arr) => ({ conceptId: arr[0], fsn: arr[1].source.fsn.term, relationships: arr.slice(1) })),
    )
    .subscribe(
        (concept: { conceptId: string, fsn: string; relationships: any[] }) => {
            const fsn: string = concept.fsn.replace('(procedure)', '(observable entity)');
            let result: string = `Declaration(Class(<http://snomed.info/id/e2o_${concept.conceptId}>))
            AnnotationAssertion(rdfs:label <http://snomed.info/id/e2o_${concept.conceptId}> "[E2O]${fsn}"^^xsd:string)
            EquivalentClasses(<http://snomed.info/id/e2o_${concept.conceptId}>
`;
            const attributes: string[] = [];

            result += '            ObjectIntersectionOf(<http://snomed.info/id/363787002>\n';

            // add existing Procedure attributes with translation to Observables attributes
            concept.relationships.forEach((relationship: { typeId: string; destinationId: string; }) => {
                attributes.push(relationship.typeId);
                switch (relationship.typeId) {
                    // Method
                    case '260686004': {
                        break;
                    }
                    // Has specimen
                    case '116686009': {
                        result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                            ObjectSomeValuesFrom(<http://snomed.info/id/704327008> <http://snomed.info/id/${relationship.destinationId}>))
                            `;
                        switch (relationship.destinationId) {
                            case '122575003': { // Urine specimen (specimen)
                                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/78014005>))
                                    `; // inheres in = urine
                                break;
                            }
                            case '119364003': { // Serum specimen (specimen)
                                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/50863008>))
                                    `; // inheres in = plasma
                                break;
                            }
                            case '119297000': { // Blood specimen (specimen)
                                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/256906008>))
                                    `; // inheres in = blood material
                                break;
                            }
                            case '119361006': { // Plasma specimen (specimen)
                                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/50863008>))
                                    `; // inheres in = plasma
                                break;
                            }
                        }
                        break;
                    }
                    // Property, Component, Using device
                    default: {
                        if (relationship.typeId === '246093002' && concept.fsn.includes('culture')) {
                            result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                                ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/${relationship.destinationId}>))
                                `;
                        } else {
                            result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                                ObjectSomeValuesFrom(<http://snomed.info/id/${relationship.typeId}> <http://snomed.info/id/${relationship.destinationId}>))
                                `;
                        }
                    }
                }
            });

            // add additional attributes derived from FSN if attributes are not present
            if (concept.fsn.includes('count') && attributes.indexOf('370130000') === -1) {
                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118550005>))
                    `; // number concentration
            }

            /*
            if (concept.fsn.includes('culture') && attributes.indexOf('370130000') === -1) {
                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118584009>))
                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                        ObjectSomeValuesFrom(<http://snomed.info/id/246501002> <http://snomed.info/id/702658000>))
                        `; // presence or identity, microbial culture technique
            }
            */

            if ((concept.fsn.includes('level') || concept.fsn.includes('measurement')) && attributes.indexOf('370130000') === -1) {
                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118594004>))
                    `; // quantity concentration
            }

            result += '            ))\n';

            console.log(result);
        },
        (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        () => console.log(')\n'),
    );
