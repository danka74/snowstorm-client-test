import { from } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, mergeMap, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const getParameter = (params: any[], q: string) => {
    return params.find((p: any) => (p.name === 'property' &&
        p.part[0].name === 'code' &&
        p.part[0].valueString === q));
};

interface Result {
    code: string;
    parameters: any[];
}

ajax({
    createXHR: () => {
        return new XMLHttpRequest();
    },
    crossDomain: true,
    headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json',
    },
    method: 'GET',
    url: 'http://localhost:8080/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=ecl/%3C%3C763158003&count=5&includeDesignations=true&_output=json',
}).pipe(
    tap((x) => {
        console.log(x.response.expansion.contains);
    }),
    mergeMap((r) => from(r.response.expansion.contains)),
        mergeMap((concept: any) => {
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
                url: `http://localhost:8080/fhir/CodeSystem/$lookup?system=http://snomed.info/sct&property=normalForm&code=${concept.code}`,
            }).pipe(
                map((r) => ({
                    code: concept.code,
                    parameters: r.response.parameter,
                })),
            );
        }),
    )
    .subscribe(
        (x: Result) => {
            return console.log(x.code + '\t' + getParameter(x.parameters, 'normalForm').part[1].valueString);
        },
        (error: any) => {
            return console.log('Error: ' + JSON.stringify(error));
        },
        () => {
            // return console.log('Completed');
        },
    );

