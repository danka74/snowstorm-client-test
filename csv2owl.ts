import fs from 'fs';
import readline from 'readline';
// import Observable from 'rxjs';
// import { map, take, takeUntil } from 'rxjs/operators';

const PRIMITIVE = 0; // A
const INHERENT_LOCATION = 1; // B
const CHARACTERIZES = 2; // C
const SCALE_TYPE = 3; // D
const DIRECT_SITE = 4; // E
const PRECONDITION = 5; // F
const RELATIVE_TO = 6; // G
const TECHNIQUE = 7; // H
const PROPERTY = 8; // I
const COMPONENT = 9; // J
const INHERES_IN = 11; // L
const ISA = 12; // M
// const ISA2 = 13;
const CONCEPTID = 13; // N
const FSN = 14; // O

const trim = (str: string, ch: string) => {
    let start = 0;
    let end = str.length;
    while (start < end && str[start] === ch) {
        ++start;
    }
    while (end > start && str[end - 1] === ch) {
        --end;
    }
    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
};

const stripTerm = (s: string) => {
    if (s.indexOf('|') > 0) {
        return trim(s.split('|')[0], ' ');
    } else {
        return trim(s, ' ');
    }
};

const stripTerm2 = (s: string) => {
    if (s.indexOf('|') > 0) {
        return trim(s.split('|')[1], ' ');
    } else {
        return trim(s, ' ');
    }
};

const main = () => {
    console.log(`Prefix(owl:=<http://www.w3.org/2002/07/owl#>)
Prefix(rdf:=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>)
Prefix(xml:=<http://www.w3.org/XML/1998/namespace>)
Prefix(xsd:=<http://www.w3.org/2001/XMLSchema#>)
Prefix(rdfs:=<http://www.w3.org/2000/01/rdf-schema#>)

Ontology(<http://snomed.info/e2o-test>
`);

    const input = process.argv[2];
    const rl = readline.createInterface({
        input: fs.createReadStream(input),
    });
    let first: boolean = true;
    rl.on('line', (line) => {
        if (first) {
            first = false;
            return;
        }
        const fields = line.split('\t');
        const conceptId = fields[CONCEPTID];
        const fsn = fields[FSN].replace('(procedure)', '(observable entity)');
        const primitive: boolean = fields[PRIMITIVE] === '1';
        const inherentLocation = stripTerm(fields[INHERENT_LOCATION]);
        const characterizes = stripTerm(fields[CHARACTERIZES]);
        const scaleType = stripTerm(fields[SCALE_TYPE]);
        const directSite = stripTerm(fields[DIRECT_SITE]);
        const precondition = stripTerm(fields[PRECONDITION]);
        const component = stripTerm(fields[COMPONENT]);
        const property = stripTerm(fields[PROPERTY]);
        const inheresin = stripTerm(fields[INHERES_IN]);
        const relativeTo = stripTerm(fields[RELATIVE_TO]);
        const technique = stripTerm(fields[TECHNIQUE]);
        const isa = stripTerm(fields[ISA]);
        // const isa2 = stripTerm(fields[ISA2]);

        if (component !== '') {

            console.log(`Declaration(Class(<http://snomed.info/id/e2o_${conceptId}>))
    AnnotationAssertion(rdfs:label <http://snomed.info/id/e2o_${conceptId}> "[E2O]${fsn}"^^xsd:string)
    AnnotationAssertion(rdfs:comment <http://snomed.info/id/e2o_${conceptId}> "${conceptId}"^^xsd:string)\n`);
            if (primitive) {
                console.log(`SubClassOf(<http://snomed.info/id/e2o_${conceptId}>\n`);
            } else {
                console.log(`EquivalentClasses(<http://snomed.info/id/e2o_${conceptId}>\n`);
            }
            console.log('\tObjectIntersectionOf(<http://snomed.info/id/363787002>\n');

            if (isa !== '') {
                if (isa.includes('10000041') || isa === '364709006' || isa === '59582004') {
                    console.log(`\t\t<http://snomed.info/id/${isa}>\n`);
                } else {
                    console.log(`\t\t<http://snomed.info/id/e2o_${isa}>\n`);
                }
            }

            /* if (isa2 !== '') {
                if (isa2.includes('10000041')) {
                    console.log(`\t\t<http://snomed.info/id/${isa2}>\n`);
                } else {
                    console.log(`\t\t<http://snomed.info/id/e2o_${isa2}>\n`);
                }
            } */

            if (component !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
    \t\t\tObjectSomeValuesFrom(<http://snomed.info/id/246093002> <http://snomed.info/id/${component}>))`);
            }

            if (directSite !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                ObjectSomeValuesFrom(<http://snomed.info/id/704327008> <http://snomed.info/id/${directSite}>))`);
            }

            if (property !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/${property}>))`);
            }

            if (inheresin !== '' && relativeTo === '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/${inheresin}>))`);
            }

            if (relativeTo !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/${relativeTo}>))`);
            }

            if (technique !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/246501002> <http://snomed.info/id/${technique}>))`);
            }

            if (inherentLocation !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/718497002> <http://snomed.info/id/${inherentLocation}>))`);
            }

            if (characterizes !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/704321009> <http://snomed.info/id/${characterizes}>))`);
            }

            if (scaleType !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/370132008> <http://snomed.info/id/${scaleType}>))`);
            }

            if (precondition !== '') {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
                    ObjectSomeValuesFrom(<http://snomed.info/id/704326004> <http://snomed.info/id/${precondition}>))`);
            }
    /*
            if (fsn.includes('count')) {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
    \t\t\tObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118550005>))`); // number concentration
            }

            if (fsn.includes('measurement') || fsn.includes('level')) {
                console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
    \t\t\tObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118594004>))`); // quantity concentration
            }
    */
            console.log('))\n');
        }
    });
    rl.on('close', () => {
        console.log(')');
    });
};

main();
