import { Attribute } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
import { Name } from '../pytools/types';

/**
 * Determines whether the name or attribute should be considered to be a class.
 * This is a heuristic test based upon the JavaScript convention for class names.
 * In future we may be able to use type information.
 */
export function isClassNameByConvention(name: Attribute | Name): boolean {
    const id = name.id;
    if (typeof id === 'string') {
        // console.lg(`name => ${JSON.stringify(name, null, 2)}`);
        const N = id.length;
        if (N > 0) {
            const firstChar = id[0];
            return firstChar.toUpperCase() === firstChar;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}

export function isMethod(functionDef: FunctionDef): boolean {
    for (let i = 0; i < functionDef.args.args.length; i++) {
        if (i === 0) {
            const arg = functionDef.args.args[i];
            if (arg.id === 'self') {
                return true;
            }
        }
        else {
            return false;
        }
    }
    return false;
}
