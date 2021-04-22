import fs from 'fs';
import readline from 'readline';
import Observable from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';

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
        const conceptId = fields[0];
        const fsn = fields[1].replace('(procedure)', '(observable entity)');
        const component = fields[3];
        const hasSpecimen = fields[9];
        console.log(`Declaration(Class(<http://snomed.info/id/e2o_${conceptId}>))
\tAnnotationAssertion(rdfs:label <http://snomed.info/id/e2o_${conceptId}> "[E2O]${fsn}"^^xsd:string)
\tAnnotationAssertion(rdfs:comment <http://snomed.info/id/e2o_${conceptId}> "${conceptId}"^^xsd:string)
\tEquivalentClasses(<http://snomed.info/id/e2o_${conceptId}>
\tObjectIntersectionOf(<http://snomed.info/id/363787002>`);

        if (component !== 'NULL') {
            console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
\t\t\tObjectSomeValuesFrom(<http://snomed.info/id/246093002> <http://snomed.info/id/${component}>))`);
        }

        if (hasSpecimen !== 'NULL') {
            console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000> 
            ObjectSomeValuesFrom(<http://snomed.info/id/704327008> <http://snomed.info/id/${hasSpecimen}>))`);
        }

        if (hasSpecimen === '119364003') {
            // inheres in = serum
            console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
\t\t\tObjectSomeValuesFrom(<http://snomed.info/id/704319004> <http://snomed.info/id/50863008>))`);
        } else {
            console.log(fields[10]);
        }

        if (fsn.includes('count')) {
            console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
\t\t\tObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118550005>))`); // number concentration
        }

        if (fsn.includes('measurement') || fsn.includes('level')) {
            console.log(`\t\tObjectSomeValuesFrom(<http://snomed.info/id/609096000>
\t\t\tObjectSomeValuesFrom(<http://snomed.info/id/370130000> <http://snomed.info/id/118594004>))`); // quantity concentration
        }

        console.log('\t))');
    });
    rl.on('close', () => {
        console.log(')');
    });
};

main();
