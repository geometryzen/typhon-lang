import {assert} from './asserts';
import {isDef, isNumber, isString} from './base';
/**
 * @param {string} message
 * @param {string} fileName
 * @param {number=} lineNumber
 */
export default function(message: string, fileName: string, lineNumber?: number) {
    assert(isString(message), "message must be a string");
    assert(isString(fileName), "fileName must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message/*, fileName*/);
    e['fileName'] = fileName;
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
