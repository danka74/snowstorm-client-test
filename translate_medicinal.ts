const combineTerms = (total: any, current: any, index: number, length: number) => {
    if (index === 0) {
        return ({
            caseSignificance: aggregateCS(total.caseSignificance, current.caseSignificance),
            term: total.term + current.term,
        });
    }
    if (index === length - 1) {
        return ({
            caseSignificance: aggregateCS(total.caseSignificance, current.caseSignificance),
            term: total.term + ' och ' + current.term.replace(/^[ ,.]+/g, ''),
        });
    }
    return ({
        caseSignificance: aggregateCS(total.caseSignificance, current.caseSignificance),
        term: total.term + ', ' + current.term.replace(/^[ ,.]+/g, ''),
    });
};

const getSemanticTag = (fsn: string) => {
    const semtag = fsn.match(/\([^)]*\)$/);
    if (semtag !== null) {
        return semtag[0];
    } else {
        return '';
    }
};

const aggregateCS = (first: string, second: string) => {
    if (first === 'ENTIRE_TERM_CASE_SENSITIVE' || first === 'INITIAL_CHARACTER_CASE_INSENSITIVE') {
        return first;
    }
    if (second === 'INITIAL_CHARACTER_CASE_INSENSITIVE') {
        return second;
    }
    if (second === 'ENTIRE_TERM_CASE_SENSITIVE') {
        return 'INITIAL_CHARACTER_CASE_INSENSITIVE';
    }
    return first;
};

const getRoleGroups = (concept: any): number[] => {
    return concept.relationships.reduce((acc: number[], cur: any) => {
        if (acc.indexOf(cur.groupId) === -1) {
            acc.push(cur.groupId);
        }
        return acc;
    }, []);
};

const translateIngredients = (concept: any): any => {
    const result: any[] = [];
    const groups = getRoleGroups(concept);
    groups.forEach((groupId) => {
        if (groupId !== 0) {
            let term: string = '';
            let caseSignificance = 'CASE_INSENSITIVE';

            const curRelationships = concept.relationships.filter((rel: any) => rel.groupId === groupId);
            const activeIngredientRel = curRelationships.find((rel: any) => rel.typeId === '127489000');
            const preciseActiveIngredientRel = curRelationships.find((rel: any) => rel.typeId === '762949000');
            const boss = curRelationships.find((rel: any) => rel.typeId === '732943007');

            if (activeIngredientRel) {
                term = activeIngredientRel.term;
                caseSignificance = activeIngredientRel.caseSignificance;
            } else if (preciseActiveIngredientRel) {
                term = preciseActiveIngredientRel.term;
                caseSignificance = preciseActiveIngredientRel.caseSignificance;
            } else {
                throw new Error('No ingredient found');
            }

            if (preciseActiveIngredientRel && boss && preciseActiveIngredientRel.destinationId !== boss.destinationId) {
                term = boss.term + ' (som ' + term + ')';
                caseSignificance = aggregateCS(boss.caseSignificance, caseSignificance);
            }

            const ingredientQualitativeStrength = curRelationships.find((rel: any) => rel.typeId === '1149366004');
            if (ingredientQualitativeStrength) {
                term += ', ' + ingredientQualitativeStrength.term;
                caseSignificance = aggregateCS(caseSignificance, ingredientQualitativeStrength.caseSignificance);
            }

            const presentNumeratorVal = curRelationships.find((rel: any) => rel.typeId === '1142135004');
            const concNumeratorVal = curRelationships.find((rel: any) => rel.typeId === '1142138002');
            if (presentNumeratorVal) {
                const numeratorUnit =
                    curRelationships.find((rel: any) => rel.typeId === '732945000');
                if (numeratorUnit.term.match('enhet([^e][^r]|$)') &&
                    presentNumeratorVal.term !== '1') {
                    term += ' ' + presentNumeratorVal.term.replace('.', ',') + ' ' +
                        numeratorUnit.term.replace('enhet', 'enheter');
                    caseSignificance = aggregateCS(caseSignificance, presentNumeratorVal.caseSignificance);
                } else {
                    term += ' ' + presentNumeratorVal.term.replace('.', ',') + ' ' + numeratorUnit.term;
                    caseSignificance = aggregateCS(caseSignificance, presentNumeratorVal.caseSignificance);
                    caseSignificance = aggregateCS(caseSignificance, numeratorUnit.caseSignificance);
                }
                const denominatorVal =
                    curRelationships.find((rel: any) => rel.typeId === '1142136003');
                if (denominatorVal && denominatorVal.term !== '1') { // ett
                    throw new Error('Not implemented: denominator value not 1, ' + JSON.stringify(denominatorVal));
                }
                const denominatorUnit =
                    curRelationships.find((rel: any) => rel.typeId === '732947008');
                if (denominatorUnit.destinationId === '732981002') { // actuation
                    const doseForm = concept.relationships.find((rel: any) => rel.typeId === '411116001');
                    if (doseForm.term.match('inhalation')) {
                        term += '/dos';
                    } else if (doseForm.term.match('sprej')) {
                        term += '/sprejning';
                    } else {
                        term += '/' + denominatorUnit.term;
                    }

                } else if (denominatorUnit && !denominatorUnit.term.match('tablett') &&
                    !denominatorUnit.term.match('kapsel')) {
                    term += '/' + denominatorUnit.term;
                }
            } else if (concNumeratorVal) {
                const numeratorUnit =
                    curRelationships.find((rel: any) => rel.typeId === '733725009');
                const denominatorVal =
                    curRelationships.find((rel: any) => rel.typeId === '1142137007');
                const denominatorUnit =
                    curRelationships.find((rel: any) => rel.typeId === '733722007');
                if (numeratorUnit.term.match('enhet([^e][^r]|$)') &&
                    concNumeratorVal.term !== '1') {
                    term += ' ' + concNumeratorVal.term.replace('.', ',') + ' ' +
                        numeratorUnit.term.replace('enhet', 'enheter') + '/'
                        + denominatorUnit.term;
                } else {
                    term += ' ' + concNumeratorVal.term.replace('.', ',') + ' ' + numeratorUnit.term + '/'
                        + denominatorUnit.term;
                }
                caseSignificance = aggregateCS(caseSignificance, concNumeratorVal.caseSignificance);
                caseSignificance = aggregateCS(caseSignificance, numeratorUnit.caseSignificance);
                caseSignificance = aggregateCS(caseSignificance, denominatorUnit.caseSignificance);
            }

            result.push({
                caseSignificance,
                term,
            });
        }

    });

    return result.sort((a: any, b: any) => {
        if (a.term > b.term) {
            return 1;
        }
        if (a.term < b.term) {
            return -1;
        }
        return 0;
    });
};

const commonPrefix = (s1: string, s2: string): number => {
    let i;
    for (i = 0; (i < s1.length) && (i < s2.length); i++) {
        if (s1[i] !== s2[i]) {
            return i - 1;
        }
    }
    return i;
};

export const combineIngredients = (ingredients: any[], caseSignificance: any): string => {
    const prefixThreshold = 6;
    if (ingredients.length) {
        let ingredientPrefix: string = ingredients[0].term;
        let prefix: number = -1;
        for (let i = 1; i < (ingredients.length); i++) {
            prefix = commonPrefix(ingredientPrefix, ingredients[i].term);
            if (prefix > 0) {
                ingredientPrefix = ingredientPrefix.slice(0, prefix);
            }
        }

        if (prefix < prefixThreshold) {
            return ingredients.reduce((total: any, word: any, index: number, wordList: any[]) => {
                return combineTerms(total, word, index, wordList.length);
            }, { term: '', caseSignificance });
        } else {
            return ingredients.reduce((total: any, word: any, index: number, wordList: any[]) => {
                return combineTerms(total,
                    { term: word.term.slice(prefix), caseSignificance: word.caseSignificance },
                    index,
                    wordList.length);
            }, { term: ingredientPrefix, caseSignificance });
        }
    }

    return '';
};

export const translate = (concept: any) => {
    const semtag = getSemanticTag(concept.fsn);

    let term = '';
    let synonym = '';
    let caseSignificance = 'CASE_INSENSITIVE';

    if (semtag === '(product)' || semtag === '(medicinal product)') {
        const playsRole = concept.relationships.find((rel: any) => rel.typeId === '766939001');
        // 318331000221102 | Active immunity stimulant therapeutic role (role) |
        if (playsRole && playsRole.destinationId === '318331000221102' ) {
            term = 'vaccin';
        } else {
            term = 'läkemedel';
        }
        let ingredients = translateIngredients(concept);
        if (ingredients.length > 0) {

            term += ' som';

            // 1142139005 | Count of base of active ingredient (attribute) |
            const countIngredient = concept.relationships.find((rel: any) => rel.typeId === '1142139005');
            if (countIngredient) {
                term += ' endast innehåller';
            } else {
                term += ' innehåller';
            }

            ingredients = combineIngredients(ingredients, caseSignificance);
            term += ' ' + ingredients.term;
            if (ingredients.caseSignificance === 'ENTIRE_TERM_CASE_SENSITIVE') {
                caseSignificance = 'INITIAL_CHARACTER_CASE_INSENSITIVE';
            } else {
                caseSignificance = ingredients.caseSignificance;
            }
        }

        if (semtag === '(product)') {
            // const playsRole = concept.relationships.find((rel: any) => rel.typeId == 766939001);
            if (playsRole) {
                term += ' med ' + playsRole.term;
                caseSignificance = aggregateCS(caseSignificance, playsRole.caseSignificance);
            }

            // 411116001 | Has manufactured dose form (attribute) |
            const doseForm = concept.relationships.find((rel: any) => rel.typeId === '411116001');
            if (doseForm) {
                term += ', ' + doseForm.term;
                caseSignificance = aggregateCS(caseSignificance, doseForm.caseSignificance);
            }
        }

        const productCharateristic = concept.relationships.find((rel: any) => rel.typeId === '860781008');
        if (productCharateristic) {
            switch (productCharateristic.destinationId) {
                case '255398004':
                    term += ', för barn';
                    break;
                case '41847000':
                    term += ', för vuxna';
                    break;
                case '262459003':
                    term += ', lågdos';
                    break;
            }
        }

    }

    if (semtag === '(medicinal product form)') {
        let ingredients = translateIngredients(concept);
        const playsRole = concept.relationships.find((rel: any) => rel.typeId === '766939001');
         // Active immunity stimulant therapeutic role (role)
        if (playsRole && playsRole.destinationId === '318331000221102') {
            term = 'vaccin som';
        } else {
            term = 'läkemedel som';
        }

        // 1142139005 | Count of base of active ingredient (attribute) |
        const countIngredient = concept.relationships.find((rel: any) => rel.typeId === '1142139005');
        if (countIngredient) {
            term += ' endast innehåller';
        } else {
            term += ' innehåller';
        }

        ingredients = combineIngredients(ingredients, caseSignificance);
        term += ' ' + ingredients.term;
        if (ingredients.caseSignificance === 'ENTIRE_TERM_CASE_SENSITIVE') {
            caseSignificance = 'INITIAL_CHARACTER_CASE_INSENSITIVE';
        } else {
            caseSignificance = ingredients.caseSignificance;
        }

        // 411116001 | Has manufactured dose form (attribute) |
        const doseForm = concept.relationships.find((rel: any) => rel.typeId === '411116001');
        if (doseForm) {
            term += ', ' + doseForm.term;
            caseSignificance = aggregateCS(caseSignificance, doseForm.caseSignificance);
        }

    }

    if (semtag === '(clinical drug)') {
        let ingredients = translateIngredients(concept);

        ingredients = combineIngredients(ingredients, caseSignificance);
        term = ingredients.term;
        caseSignificance = ingredients.caseSignificance;

        // 411116001 | Has manufactured dose form (attribute) |
        const doseForm = concept.relationships.find((rel: any) => rel.typeId === '411116001');
        if (doseForm) {
            term += ', ' + doseForm.term;
            caseSignificance = aggregateCS(caseSignificance, doseForm.caseSignificance);
        }

        synonym = 'läkemedel som endast innehåller exakt ' + term;

    }

    const targetPopulation = concept.relationships.find((rel: any) => rel.typeId === '1149367008');
    if (targetPopulation) {
        term += ', ' + targetPopulation.term;
        caseSignificance = aggregateCS(caseSignificance, targetPopulation.caseSignificance);
    }

    return ({
        caseSignificance,
        conceptId: concept.conceptId,
        fsn: concept.fsn,
        synonym,
        term: term.trim(),
    });
};
