import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, map, mapTo, mergeMap, switchMap, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const icd10 = ['F00.0',
'F00.1',
'F00.2',
'F00.9',
'F01.0',
'F01.1',
'F01.2',
'F01.3',
'F01.8',
'F01.9',
'F02.0',
'F02.1',
'F02.2',
'F02.3',
'F02.4',
'F02.8',
'F03.9',
'F10.7A',
'F10.3',
'F10.4',
'F11.3',
'F11.4',
'F12.3',
'F12.4',
'F13.3',
'F13.4',
'F14.3',
'F14.4',
'F15.3',
'F15.4',
'F16.3',
'F16.4',
'F18.3',
'F18.4',
'F19.3',
'F19.4',
'F10.0',
'F10.5',
'F10.7',
'F11.0',
'F11.5',
'F11.7',
'F12.0',
'F12.5',
'F12.7',
'F13.0',
'F13.5',
'F13.7',
'F14.0',
'F14.5',
'F14.7',
'F15.0',
'F15.5',
'F15.7',
'F16.0',
'F16.5',
'F16.7',
'F18.0',
'F18.5',
'F18.7',
'F19.0',
'F19.5',
'F19.7',
'F10.2',
'F11.2',
'F12.2',
'F13.2',
'F14.2',
'F15.2',
'F16.2',
'F18.2',
'F19.2',
'F20.0',
'F20.1',
'F20.2',
'F20.3',
'F20.4',
'F20.5',
'F20.6',
'F20.8',
'F20.9',
'F21.9',
'F22.0',
'F22.8',
'F22.9',
'F23.0',
'F23.1',
'F23.2',
'F23.3',
'F23.8',
'F23.9',
'F24.9',
'F25.0',
'F25.1',
'F25.2',
'F25.8',
'F25.9',
'F28.9',
'F29.9',
'F30.2',
'F30.1',
'F30.2',
'F30.8',
'F30.9',
'F31.1',
'F31.2',
'F31.4',
'F31.5',
'F31.6',
'F31.8',
'F31.9',
'F32.2',
'F32.3',
'F32.3W',
'F32.8',
'F32.9',
'F33.2',
'F33.3',
'F33.8',
'F33.9',
'F41.0',
'F41.8',
'F41.9',
'F06.0',
'F06.1',
'F06.2',
'F06.3',
'F06.4',
'F42.0',
'F42.1',
'S06.0',
'S06.1',
'S06.2',
'S06.3',
'S06.4',
'S06.5',
'S06.6',
'S06.7',
'S06.8',
'S06.9',
'F70.0',
'F70.1',
'F70.8',
'F70.9',
'F71.0',
'F71.1',
'F71.8',
'F71.9',
'F72.0',
'F72.1',
'F72.8',
'F72.9',
'F73.0',
'F73.1',
'F73.8',
'F73.9',
'F78.0',
'F78.1',
'F78.8',
'F78.9',
'F79.0',
'F79.1',
'F79.8',
'F79.9',
];

const getConcepts = (): Observable<any> => {
  return from(icd10);
};

getConcepts()
  .pipe(
    mergeMap((code) => {
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
        url:
          'http://localhost:8080/fhir/ConceptMap/$translate?code=' +
          code +
          '&system=http://hl7.org/fhir/sid/icd-10&source=http://hl7.org/' +
          'fhir/sid/icd-10&target=http://snomed.info/sct&_format=json',
      }).pipe(
        map((result) => {
          return { icd: code, response: result.response };
        }),
      );
    }),
    // tap((result) => console.log(result)),
    mergeMap((result: any) => {
      const param = result.response.parameter;
      if (param[0].name === 'result' && param[0].valueBoolean === true) {
        const t = param[1].part.map((concept: any) => ({ icd: result.icd, snomed: concept.valueCoding.code }));
        return from(t);
      } else {
        return from([]);
      }
    }),
    mergeMap((concept: any) => {
      const $lookup = ajax({
        createXHR: () => {
          return new XMLHttpRequest();
        },
        crossDomain: true,
        headers: {
          'Accept-Language': 'sv',
          'Content-Type': 'application/json',
        },
        method: 'GET',
        url:
          'http://localhost:8080/MAIN%2FSNOMEDCT-SE/concepts/' +
            concept.snomed,
      }).pipe(
        map((result: any) => ({
          fsn: result.response.fsn.term,
          icd: concept.icd,
          pt: result.response.pt.term,
          snomed: concept.snomed,
          })),
      );
      return $lookup;
    }),
    // mapTo(1),
    // reduce((tot: number, val: any) => tot + val, 0),
  )
  .subscribe(
    (x: any) => console.log(x.icd + '\t' + x.snomed + '\t' + x.pt + '\t' + x.fsn),
    (error: any) => console.log('Error: ' + error),
    () => console.log('Completed'),
  );
