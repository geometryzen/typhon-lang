import { ParseTables } from './tables';
import { Tokens as TOK } from './Tokens';
import { tokenNames } from './tokenNames';

export function grammarName(type: TOK | number): string {
    const tokenName = tokenNames[type];
    if (tokenName) {
        return tokenName;
    }
    else {
        return ParseTables.number2symbol[type];
    }
}
