import { from, Observable, of } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { concat, filter, map, mapTo, mergeMap, switchMap, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const doseUnits = [
    '732978007',
    '413568008',
    '258768008',
    '61051000052105',
    '61061000052108',
    '258672001',
    '61091000052100',
    '61081000052102',
    '61001000052109',
    '61111000052107',
    '733013000',
    '60991000052105',
    '732994000',
    '61011000052106',
    '767525000',
    '258949000',
    '733006000',
    '700474006',
    '258682000',
    '732996003',
    '422237004',
    '732998002',
    '732937005',
    '258770004',
    '258994006',
    '61031000052101',
    '258685003',
    '258837002',
    '258838007',
    '258719008',
    '61211000052102',
    '258684004',
    '1941000175103',
    '258833003',
    '258834009',
    '258773002',
    '258859000',
    '258989006',
    '258718000',
    '258844006',
    '258845007',
    '258701004',
    '61041000052107',
    '258686002',
    '258731005',
    '733010002',
    '415067009',
    '61101000052105',
    '419694003',
    '61021000052103',
    '733000006',
    '733019001',
    '732936001',
    '61071000052104',
    '732989000',
    '60981000052108',
    '700483001',
    '700482006',
    '733007009',
];

const getConcepts = (): Observable<string> => {
  return from(doseUnits);
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
          'http://localhost:8080/MAIN%2FSNOMEDCT-SE/concepts?activeFilter=true&ecl=(%3E%3E' + code
          + '%20AND%20732935002)%20OR%20(%3E%3E' + code
          + '%20AND%20408102007)&offset=0&limit=1',
      })
      .pipe(
          filter((result: AjaxResponse) => result.response.total > 0),
          map((result: AjaxResponse) => ({
            conceptId: code,
            kind: result.response.items[0],
          })),
      );
    }),
    mergeMap((cat) => {
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
              'http://localhost:8080/MAIN%2FSNOMEDCT-SE/concepts/' + cat.conceptId,
          })
          .pipe(
              map((result) => ({
                  kind: cat.kind,
                  unit: result.response,
              })),
          );
    }),
  )
  .subscribe(
    (x: any) => console.log(x.unit.conceptId + '\t' + x.unit.fsn.term + '\t' + x.kind.fsn.term),
    (error: any) => console.log(error),
    () => console.log('Completed'),
  );
