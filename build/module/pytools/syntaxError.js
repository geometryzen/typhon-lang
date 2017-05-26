import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
/**
 * @param message
 * @param lineNumber
 */
export function syntaxError(message, lineNumber) {
    assert(isString(message), "message must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
