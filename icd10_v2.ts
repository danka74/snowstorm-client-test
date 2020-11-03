import { from, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { concat, filter, map, mapTo, mergeMap, switchMap, tap } from 'rxjs/operators';
import { XMLHttpRequest } from 'xmlhttprequest';

const icd10 = [
  'M45', 'M16', 'M17', 'M05', 'M06', 'M07',
/*'C38.0',
'D15.1',
'I05.0',
'I05.1',
'I05.2',
'I21.9',
'I23.6',
'I25.2',
'I25.3',
'I25.5',
'I27.0',
'I27.1',
'I27.2',
'I31.2',
'H31.3',
'I34.0',
'I34.1',
'I34.2',
'I34.8',
'I35.0',
'I35.1',
'I35.2',
'I35.8',
'I35.0',
'I36.1',
'I36.2',
'I36.8',
'I37.0',
'I37.1',
'I37.2',
'I39.0',
'I39.1',
'I29.2',
'I39.3',
'I39.4',
'I40.9',
'I42.0',
'I42.1',
'I42.5',
'I42.7',
'I42.8',
'I43.1',
'I90.3',
'I50.0',
'I50.1',
'I50.3',
'I51.0',
'I51.1',
'I51.2',
'I51.3',
'I51.7',
'I72.0',
'I71.1',
'I72.2',
'J90.9',
'Q21.0',
'Q21.1',
'Q21.3',
'Q21.4',
'Q21.8',
'Q23.0',
'Q23.1',
'Q23.2',
'Q23.3',
'Q23.4',
'Q23.8',
'Q24.2',
'Q25.0',
'Q25.1',
'Q25.2',
'Q25.3',
'Z71.1'
  /*
  'S72.0', 'S72.1', 'S72.2',
'S22.0', 'S22.1', 'S32.0', 'S32.7', 'M48.5',
'S32.1', 'S32.3', 'S32.4', 'S32.5',
'S42.2',
'S52.5', 'S52.6', */
/*   'F00.0',
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
  'F02.3','L23',
'L24',
'L25',
'L26',
'L27',
'L28',
'L29',
'L30',
'L40',
'L50',

  'F02.4',
  'F02.8',
  'F03.9',
  'F06.0',
  'F06.1',
  'F06.2',
  'F06.3',
  'F06.4',
  'F10.0',
  'F10.3',
  'F10.4',
  'F10.5',
  'F10.7',
  'F10.7A',
  'F11.0',
  'F11.3',
  'F11.4',
  'F11.5',
  'F11.7',
  'F12.0',
  'F12.3',
  'F12.4',
  'F12.5',
  'F12.7',
  'F13.0',
  'F13.3',
  'F13.4',
  'F13.5',
  'F13.7',
  'F14.0',
  'F14.3',
  'F14.4',
  'F14.5',const
  'F14.7',
  'F15.0',
  'F15.3',
  'F15.4',
  'F15.5',
  'F15.7',
  'F16.0',
  'F16.3',
  'F16.4',
  'F16.5',
  'F16.7 ',
  'F18.0',
  'F18.3',
  'F18.4',
  'F18.5',
  'F18.7',
  'F19.0',
  'F19.3',
  'F19.4',
  '  'F00.0',
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
  'F06.0',
  'F06.1',
  'F06.2',
  'F06.3',
  'F06.4',
  'F10.0',
  'F10.3',
  'F10.4',
  'F10.5',
  'F10.7',
  'F10.7A',
  'F11.0',
  'F11.3',
  'F11.4',
  'F11.5',
  'F11.7',
  'F12.0',
  'F12.3',
  'F12.4',
  'F12.5',
  'F12.7',
  'F  'F00.0',
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
  'F06.0',
  'F06.1',
  'F06.2',const
  'F06.3',
  'F06.4',
  'F10.0',
  'F10.3',
  'F10.4',
  'F10.5',
  'F10.7',
  'F10.7A',
  'F11.0',
  'F11.3',
  'F11.4',
  'F11.5',
  'F11.7',
  'F12.0',
  'F12.3',
  'F12.4',
  'F12.5','L23',
'L24',
'L25',
'L26',
'L27',
'L28',
'L29',
'L30',
'L40',
'L50',

  'F12.7',
  'F13.0',
  'F13.3',
  'F13.4',
  'F13.5',
  'F13.7',
  'F14.0',
  'F14.3',
  'F14.4',
  'F14.5',
  'F14.7',
  'F15.0',
  'F15.3',
  'F15.4',
  'F15.5',
  'F15.7',
  'F16.0',
  'F16.3',
  'F16.4',
  'F16.5',
  'F16.7 ',
  'F18.0',
  'F18.3',
  'F18.4',
  'F18.5',
  'F18.7',
  'F19.0',
  'F19.3',
  'F19.4',
  'F19.5',
  'F19.7',
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
  'F41.0',
  'F42.0',
  'F42.1',
  'F43.0',
  'F43.1',
  'F60.3',
  'F70.1',
  'F71.1',
  'F72.1',
  'F73.1',
  'F78.1',
  'F79.1',13.0',
  'F13.3',
  'F13.4',
  'F13.5',
  'F13.7',
  'F14.0',
  'F14.3',
  'F14.4',
  'F14.5',
  'F14.7',
  'F15.0',
  'F15.3',
  'F15.4',
  'F15.5',
  'F15.7',
  'F16.0',
  'F16.3',
  'F16.4',
  'F16.5',
  'F16.7 ',
  'F18.0',
  'F18.3',
  'F18.4',
  'F18.5',
  'F18.7',
  'F19.0',
  'F19.3',
  'F19.4',
  'F19.5',
  'F19.7',
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
  '  'F00.0',
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
  'F06.0',
  'F06.1',
  'F06.2',
  'F06.3',
  'F06.4',
  'F10.0',
  'F10.3',
  'F10.4',
  'F10.5',
  'F10.7',
  'F10.7A',
  'F11.0',
  'F11.3',
  'F11.4',
  'F11.5',
  'F11.7',
  'F12.0',
  'F12.3',
  'F12.4',
  'F12.5',
  'F12.7',
  'F13.0',
  'F13.3',
  'F13.4',
  'F13.5',
  'F13.7',
  'F14.0',
  'F14.3',
  'F14.4',
  'F14.5',
  'F14.7',
  'F15.0',
  'F15.3',
  'F15.4',
  'F15.5',
  'F15.7',
  'F16.0',
  'F16.3',
  'F16.4',
  'F16.5',
  'F16.7 ',
  'F18.0',
  'F18.3',
  'F18.4',
  'F18.5',
  'F18.7',
  'F19.0',
  'F19.3',
  'F19.4',
  'F19.5',
  'F19.7',
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
  'F41.0',
  'F42.0',
  'F42.1',
  'F43.0',
  'F43.1',
  'F60.3',
  'F70.1',
  'F71.1',
  'F72.1',
  'F73.1',
  'F78.1',
  'F79.1',F25.0',
  'F25.1',
  'F25.2',
  'F25.8',
  'F25.9',
  'F28.9',
  'F29.9',
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
  'F41.0',
  'F42.0',
  'F42.1',
  'F43.0',
  'F43.1',
  'F60.3',
  'F70.1',
  'F71.1',
  'F72.1',
  'F73.1',
  'F78.1',
  'F79.1',F19.5',
  'F19.7',
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
  'F31.9','L23',
'L24',
'L25',
'L26',
'L27',
'L28',
'L29',
'L30',
'L40',
'L50',

  'F32.2',
  'F32.3',
  'F32.3W',
  'F32.8',
  'F32.9',
  'F33.2',
  'F33.3',
  'F33.8',
  'F41.0',
  'F42.0',
  'F42.1',
  'F43.0',
  'F43.1',
  'F60.3',
  'F70.1',
  'F71.1',
  'F72.1',
  'F73.1',
  'F78.1',
  'F79.1', */
];

const getConcepts = (): Observable<string> => {
  return from(icd10);
};

getConcepts()
  .pipe(
    /* mergeMap((code: string) => {
      return from([code, code + '0', code + '1']);
    }), */
    mergeMap((code: string) => {
      if (code.length === 3) {
        return from([
          code,
          code + '.0',
          code + '.1',
          code + '.2',
          code + '.3',
          code + '.4',
          code + '.5',
          code + '.6',
          code + '.7',
          code + '.8',
          code + '.9',
      ]);
      }
      if (code.endsWith('.9')) {
        return from([code, code.slice(0, -2)]);
      } else {
        return of(code);
      }
    }),
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
          'http://localhost:8080/MAIN%2FSNOMEDCT-SE/members?referenceSet=447562003&active=true&mapTarget=' +
          code +
          '&offset=0&limit=1000',
      });
    }),
    //tap(console.log),
    mergeMap((result: any) => from(result.response.items)),
    // tap(console.log),
    map((mapping: any) => ({
        icd: mapping.additionalFields.mapTarget,
        snomed: mapping.referencedComponent.conceptId,
        mapGroup: mapping.additionalFields.mapGroup,
        pt: mapping.referencedComponent.pt.term,
        fsn: mapping.referencedComponent.fsn.term,
        advice: mapping.additionalFields.mapAdvice,
    })),
    // tap((result) => console.log(result))
  )
  .subscribe(
    (x: any) => console.log(x.icd + '\t' + x.snomed + '\t' + x.pt + '\t' + x.mapGroup + '\t' + x.fsn + '\t' + x.advice),
    (error: any) => console.log(error),
    () => console.log('Completed'),
  );
