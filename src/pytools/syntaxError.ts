import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
/**
 * @param message
 * @param lineNumber
 */
export function syntaxError(message: string, lineNumber?: number) {
    assert(isString(message), "message must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    const e = new SyntaxError(message/*, fileName*/);
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
