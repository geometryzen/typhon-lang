import { FunctionDef } from '../pytools/types';
import { Name } from '../pytools/types';

export function isClassNameByConvention(name: Name): boolean {
    const id = name.id;
    const N = id.length;
    if (N > 0) {
        const firstChar = id[0];
        return firstChar.toUpperCase() === firstChar;
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
