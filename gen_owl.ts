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
    conceptIds: [
'104133003',
'14089001',
'28317006',
'442673006',
'413625003',
'66842004',
'37254006',
'54706004',
'391558003',
'165511009',
'396451008',
'767002',
'442673006',
'271038001',
'313835008',
'26958001',
'42351005',
'273971007',
'250216004',
'43396009',
'271238006',
'270990000',
'271241002',
'166832000',
'250641004',
'166833005',
'269821003',
'312349000',
'271238006',
'104485008',
'395144002',
'113075003',
'167036008',
'43396009',
'271216009',
'313835008',
'313440008',
'313849004',
'409087007',
'61928009',
'26604007',
'61928009',
'74765001',
'310540006',
'63476009',
'252167001',
'271037006',
'252167001',
'395015001',
'104934005',
'313837000',
'46716003',
'71960002',
'271245006',
'30630007',
'271036002',
'443796007',
'271260009',
'271236005',
'273966000',
'33747003',
'167226008',
'395202001',
'271035003',
'67776007',
'395065005',
'34608000',
'313837000',
'313989009',
'273969007',
'390955003',
'390958001',
'166842003',
'390964008',
'390961000',
'313936008',
'117010004',
'72191006',
'61594008',
'60306005',
'270980008',
'273967009',
'166708003',
'271239003',
'398245009',
'167096006',
'412808005',
'271240001',
'166610007',
'271075006',
'270992008',
'88810008',
'20109005',
'271244005',
'165426009',
'135842001',
'270994009',
'313840000',
'390962007',
'271234008',
'22569008',
    ],
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
                // tap(console.log),
                filter((relationship: any) => relationship.typeId !== '116680003'), // filter out Is A
                /* mergeMap((relationship: any) => {
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
                        url: 'http://localhost:8080/browser/MAIN/concepts/'
                            + relationship.destinationId,
                    }).pipe(
                        map((concept) => {
                            relationship.destinationConcept = concept;
                            return relationship;
                        }),
                    );
                }), */
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
            AnnotationAssertion(rdfs:label <http://snomed.info/id/e2o_${concept.conceptId}> "${fsn}"^^xsd:string)
            EquivalentClasses(<http://snomed.info/id/e2o_${concept.conceptId}> 
                ObjectIntersectionOf(<http://snomed.info/id/363787002>
`;

            const attributes: string[] = [];

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
                        result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                            ObjectSomeValuesFrom(<http://snomed.info/id/${relationship.typeId}> <http://snomed.info/id/${relationship.destinationId}>))
                            `;
                    }
                }
            });

            // add additional attributes derived from FSN if attributes are not present
            if (concept.fsn.includes('count') && attributes.indexOf('370130000') === -1) {
                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118550005>))
                    `;
            }
            if ((concept.fsn.includes('level') || concept.fsn.includes('measurement')) && attributes.indexOf('370130000') === -1) {
                result += `                    ObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118594004>))
                    `;
            }

            result += '            ))\n';

            console.log(result);
        },
        (error: any) => console.log ('Error: ' + JSON.stringify(error)),
        () => console.log(')\n'),
    );
