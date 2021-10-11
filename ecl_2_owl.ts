import { from, Observable, of } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { concat, filter, groupBy, map,
    mergeMap, reduce, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const mappingTable = [
{
    search: {
        activeFilter: true,
        definitionStatusFilter: '900000000000073002',
        eclFilter: `<<386053000 | Evaluation procedure (procedure) |:
            116686009 |Has specimen (attribute)| = <<119297000 | Blood specimen (specimen) |,
            246093002 |Component (attribute)| = <105590001 | Substance (substance) |`,
    },
    transforms: [
        {
            attributeId: '116686009', // Has specimen
            to: [
                {
                    toAttributeId: '704319004', // Inheres in
                    valueECLSuffix: '.370133003 |Specimen substance|',
                },
                {
                    toAttributeId: '704327008', // Direct site
                    valueECLSuffix: '',
                },
            ],
        },
        {
            attributeId: '246093002',
            to: [
                {
                    toAttributeId: '246093002',
                    valueECLSuffix: '',
                },
            ],
        },
        {
            attributeId: '260686004',
            to: [],
        },
    ],
},
{
    search: {
        activeFilter: true,
        definitionStatusFilter: '900000000000073002',
        eclFilter: `<118218001 | Cell count (procedure) |:
            246093002 | Component (attribute) | = <<63370004 | Blood cell (cell) |`,
    },
    transforms: [
        {
            attributeId: '116686009', // Has specimen
            to: [
                {
                    toAttributeId: '704319004', // Inheres in
                    valueECLSuffix: '.370133003 |Specimen substance|',
                },
                {
                    toAttributeId: '704327008', // Direct site
                    valueECLSuffix: '',
                },
            ],
        },
        {
            attributeId: '246093002', // Component
            to: [
                {
                    toAttributeId: '246093002', // Component
                    valueECLSuffix: '',
                },
            ],
        },
        {
            attributeId: '260686004', // Method
            to: [],
        },
    ],
},
];

const MAX_PAGE_SIZE = 10000;

const host = 'http://localhost:8080/snowstorm/snomed-ct/';

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
        url: host + 'MAIN/concepts/search',
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

console.log(`Prefix(owl:=<http://www.w3.org/2002/07/owl#>)
Prefix(rdf:=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>)
Prefix(xml:=<http://www.w3.org/XML/1998/namespace>)
Prefix(xsd:=<http://www.w3.org/2001/XMLSchema#>)
Prefix(rdfs:=<http://www.w3.org/2000/01/rdf-schema#>)

Ontology(<http://snomed.info/e2o-test>
`);

from(mappingTable).pipe(
    mergeMap((mapping) => {
        return getConcepts(mapping.search)
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
                    url: host + `MAIN/relationships?active=true&source=${concept.conceptId}`
                        + '&characteristicType=INFERRED_RELATIONSHIP',
                }).pipe(
                    mergeMap((result: any) => from(result.response.items)),
                    filter((relationship: any) => relationship.typeId !== '116680003'), // filter out Is A
                );
            }),
            mergeMap((relationship) => {
                const transform = mapping.transforms.find((t) => t.attributeId === relationship.typeId);
                if (transform) {
                    const result = transform.to.map((to) => ({
                        relationship,
                        to,
                    }));
                    return from(result);
                } else {
                    return of({
                        relationship,
                        to: null,
                    });
                }
            }),
            mergeMap((r) => {
                if (r.to) {
                    if (r.to.valueECLSuffix !== '') {
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
                            url: host + 'MAIN/concepts?active=true&ecl='
                                + `${r.relationship.destinationId}${r.to.valueECLSuffix}`,
                        }).pipe(
                            map((data: AjaxResponse) => data.response.items[0]),
                            mergeMap((concept) => {
                                const newRelationship = r.relationship;
                                newRelationship.typeId = r.to.toAttributeId;
                                newRelationship.destinationId = concept.conceptId;
                                return of(newRelationship);
                            }),
                        );
                    } else {
                        const newRelationship = r.relationship;
                        newRelationship.typeId = r.to.toAttributeId;
                        return of(newRelationship);
                    }
                } else {
                    return of(r.relationship);
                }
            }),
            groupBy((relationship) => relationship.sourceId),
            mergeMap((concept) => concept.pipe(reduce((acc, cur) => [...acc, cur], [concept.key]))),
            map((arr) => ({ conceptId: arr[0], fsn: arr[1].source.fsn.term, relationships: arr.slice(1) })),
        );
    }),
).subscribe(
    (concept) => {
        const fsn: string = concept.fsn.replace('(procedure)', '(observable entity)');
        console.log(`Declaration(Class(<http://snomed.info/id/e2o_${concept.conceptId}>))
            AnnotationAssertion(rdfs:label <http://snomed.info/id/e2o_${concept.conceptId}> "[E2O] ${fsn}"^^xsd:string)
            EquivalentClasses(<http://snomed.info/id/e2o_${concept.conceptId}>`);
        let result = '';
        concept.relationships.forEach((relationship: { typeId: string; destinationId: string; }) => {
            result += `ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                ObjectSomeValuesFrom(<http://snomed.info/id/${relationship.typeId}> <http://snomed.info/id/${relationship.destinationId}>))\n`;
        });

        if (concept.fsn.includes('level') || concept.fsn.includes('measurement')) { // quantity concentration
            result += `ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118594004>))\n`;
        }

        if (concept.fsn.includes('count')) { // number concentration
            result += `ObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118550005>))\n`;
        }

        if (result !== '') {
            console.log('ObjectIntersectionOf(<http://snomed.info/id/363787002> ' + result + ')');
        }
        console.log(')'); // end of declaration
    },
    (error) => console.log(error),
    () => console.log(')\n'),
);
