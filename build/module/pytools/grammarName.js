import { ParseTables } from './tables';
import { tokenNames } from './tokenNames';
export function grammarName(type) {
    var tokenName = tokenNames[type];
    if (tokenName) {
        return tokenName;
    }
    else {
        return ParseTables.number2symbol[type];
    }
}
