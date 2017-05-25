import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
/**
 * @param message
 * @param fileName
 * @param lineNumber
 */
export function syntaxError(message, fileName, lineNumber) {
    assert(isString(message), "message must be a string");
    assert(isString(fileName), "fileName must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    e['fileName'] = fileName;
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
