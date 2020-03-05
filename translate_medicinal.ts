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
            term: total.term + ' och ' + current.term,
        });
    }
    return ({
        caseSignificance: aggregateCS(total.caseSignificance, current.caseSignificance),
        term: total.term + ', ' + current.term,
    });
};

const getSemanticTag = (fsn: string) => {
    const semtag = fsn.match(/\([^)]*\)/);
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

const numerize = (word: string): string => {
    if (word === "ett") {
        return "1";
    }
    if (word === "två") {
        return "2";
    } else
    if (word === "tre") {
        return "3";
    } else
    if (word === "fyra") {
        return "4";
    } else
    if (word === "fem") {
        return "5";
    }
    if (word === "sex") {
        return "6";
    }
    if (word === "sju") {
        return "7";
    } else
    if (word === "åtta") {
        return "8";
    } else
    if (word === "nio") {
        return "9";
    } else
    if (word === "tio") {
        return "10";
    }
    return word;
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

            const curRelationships = concept.relationships.filter((rel: any) => rel.groupId == groupId);
            const activeIngredientRel = curRelationships.find((rel: any) => rel.typeId == 127489000);
            const preciseActiveIngredientRel = curRelationships.find((rel: any) => rel.typeId == 762949000);
            const boss = curRelationships.find((rel: any) => rel.typeId == 732943007);

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

            const presentNumeratorVal = curRelationships.find((rel: any) => rel.typeId == 732944001);
            const concNumeratorVal = curRelationships.find((rel: any) => rel.typeId == 733724008);
            if (presentNumeratorVal) {
                const numeratorUnit =
                    curRelationships.find((rel: any) => rel.typeId == 732945000 || rel.typeId == 733725009);
                if (numeratorUnit.term === 'enhet' &&
                    presentNumeratorVal.term.replace(/ /g, '') > 1) {
                    term += ' ' + numerize(presentNumeratorVal.term) + ' enheter';
                    caseSignificance = aggregateCS(caseSignificance, presentNumeratorVal.caseSignificance);
                } else {
                    term += ' ' + numerize(presentNumeratorVal.term) + ' ' + numeratorUnit.term;
                    caseSignificance = aggregateCS(caseSignificance, presentNumeratorVal.caseSignificance);
                    caseSignificance = aggregateCS(caseSignificance, numeratorUnit.caseSignificance);

                }
            } else if (concNumeratorVal) {
                const numeratorUnit =
                    curRelationships.find((rel: any) => rel.typeId == 732945000 || rel.typeId == 733725009);
                const denominatorVal =
                    curRelationships.find((rel: any) => rel.typeId == 732946004 || rel.typeId == 733723002);
                const denominatorUnit =
                    curRelationships.find((rel: any) => rel.typeId == 732947008 || rel.typeId == 733722007);
                if (numeratorUnit.term === 'enhet' &&
                    concNumeratorVal.term.replace(/ /g, '') > 1) {
                    term += ' ' + numerize(concNumeratorVal.term) + ' enheter/'
                        + denominatorUnit.term;
                    caseSignificance = aggregateCS(caseSignificance, concNumeratorVal.caseSignificance);
                    caseSignificance = aggregateCS(caseSignificance, denominatorUnit.caseSignificance);
                } else {
                    term += ' ' + numerize(concNumeratorVal.term) + ' ' + numeratorUnit.term + '/' 
                        + denominatorUnit.term;
                    caseSignificance = aggregateCS(caseSignificance, concNumeratorVal.caseSignificance);
                    caseSignificance = aggregateCS(caseSignificance, numeratorUnit.caseSignificance);
                    caseSignificance = aggregateCS(caseSignificance, denominatorUnit.caseSignificance);
                }
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

export const translate = (concept: any) => {
    const semtag = getSemanticTag(concept.fsn);

    let term = '';
    let synonym = '';
    let caseSignificance = 'CASE_INSENSITIVE';

    if (semtag === '(product)' || semtag === '(medicinal product)') {
        term = 'läkemedel ';
        let ingredients = translateIngredients(concept);
        if (ingredients.length > 0) {

            term += 'som ';

            // 766952006 | Count of base of active ingredient (attribute) |
            const countIngredient = concept.relationships.find((rel: any) => rel.typeId == 766952006);
            if (countIngredient) {
                term += 'endast innehåller ';
            } else {
                term += 'innehåller ';
            }

            ingredients = ingredients.reduce((total: string, word: string, index: number, wordList: string[]) => {
                return combineTerms(total, word, index, wordList.length);
            }, { term: '', caseSignificance });
            term += ingredients.term + ' ';
            if (ingredients.caseSignificance === 'ENTIRE_TERM_CASE_SENSITIVE') {
                caseSignificance = 'INITIAL_CHARACTER_CASE_INSENSITIVE';
            } else {
                caseSignificance = ingredients.caseSignificance;
            }
        }

        const playsRole = concept.relationships.find((rel: any) => rel.typeId == 766939001);
        if (playsRole) {
            term += 'med ' + playsRole.term;
            caseSignificance = aggregateCS(caseSignificance, playsRole.caseSignificance);
        }

    }

    if (semtag === '(medicinal product form)') {
        let ingredients = translateIngredients(concept);
        term = 'läkemedel som ';

        // 766952006 | Count of base of active ingredient (attribute) |
        const countIngredient = concept.relationships.find((rel: any) => rel.typeId == 766952006);
        if (countIngredient) {
            term += 'endast innehåller ';
        } else {
            term += 'innehåller ';
        }

        ingredients = ingredients.reduce((total: string, word: string, index: number, wordList: string[]) => {
            return combineTerms(total, word, index, wordList.length);
        }, { term: '', caseSignificance });
        term += ingredients.term;
        if (ingredients.caseSignificance === 'ENTIRE_TERM_CASE_SENSITIVE') {
            caseSignificance = 'INITIAL_CHARACTER_CASE_INSENSITIVE';
        } else {
            caseSignificance = ingredients.caseSignificance;
        }

        // 411116001 | Has manufactured dose form (attribute) |
        const doseForm = concept.relationships.find((rel: any) => rel.typeId == 411116001);
        if (doseForm) {
            term += ', ' + doseForm.term;
            caseSignificance = aggregateCS(caseSignificance, doseForm.caseSignificance);
        }

    }

    if (semtag === '(clinical drug)') {
        let ingredients = translateIngredients(concept);

        ingredients = ingredients.reduce((total: string, word: string, index: number, wordList: string[]) => {
            return combineTerms(total, word, index, wordList.length);
        }, { term: '', caseSignificance });
        term = ingredients.term;
        caseSignificance = ingredients.caseSignificance;

        // 411116001 | Has manufactured dose form (attribute) |
        const doseForm = concept.relationships.find((rel: any) => rel.typeId == 411116001);
        if (doseForm) {
            term += ', ' + doseForm.term;
            caseSignificance = aggregateCS(caseSignificance, doseForm.caseSignificance);
        }

        synonym = 'läkemedel som endast innehåller exakt ' + term;

    }

    return ({
        caseSignificance,
        conceptId: concept.conceptId,
        fsn: concept.fsn,
        synonym,
        term,
    });
};
