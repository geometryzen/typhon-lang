import { Tokens } from './Tokens';
/**
 * Mapping from operator textual symbols to token symbolic constants.
 */
export declare const OpMap: {
    [op: string]: Tokens;
};
/**
 * An Arc is a pair, represented in an array, consisting a label and a to-state.
 */
export declare const ARC_SYMBOL_LABEL = 0;
export declare const ARC_TO_STATE = 1;
export declare type Arc = [number, number];
/**
 *
 */
export declare const IDX_DFABT_DFA = 0;
export declare const IDX_DFABT_BEGIN_TOKENS = 1;
export declare type State = Arc[];
export declare type Dfa = State[];
export declare type BeginTokens = {
    [value: number]: number;
};
export declare type DfaAndBeginTokens = [Dfa, BeginTokens];
export declare const IDX_LABEL_TOKEN_OR_SYMBOL = 0;
export declare const IDX_LABEL_NAME = 1;
export declare type Label = [number, string | null];
/**
 * Describes the shape of the ParseTables objects.
 */
export interface Grammar {
    /**
     * The number of the grammar's start symbol.
     */
    start: number;
    /**
     * A dict mapping symbol numbers to (DFA, first)
     * pairs, where DFA is an item from the states list
     * above, and first is a set of tokens that can
     * begin this grammar rule (represented by a dict
     * whose values are always 1).
     */
    dfas: {
        [symbolId: number]: DfaAndBeginTokens;
    };
    /**
     * The first index is the symbol for a transition (a number).
     * The second index is the haman-readable decode of the symbol, if it exists, otherwise `null`.
     * Not all symbols have human-readable names.
     * All symbols that have human-readable names are keywords, with one exception.
     * The symbol 0 (zero) is an exceptional symbol and has the human-readavble name 'EMPTY'.
     *
     * a list of (x, y) pairs where x is either a token
     * number or a symbol number, and y is either None
     * or a string; the strings are keywords.  The label
     * number is the index in this list; label numbers
     * are used to mark state transitions (arcs) in the
     * DFAs.
     */
    labels: Label[];
    /**
     * A mapping from a keyword to the symbol that has been assigned to it.
     */
    keywords: {
        [keyword: string]: number;
    };
    /**
     * A mapping from a token to a symbol.
     * A dict mapping token numbers to arc labels
     */
    tokens: {
        [token: number]: number;
    };
    /**
     * Actually maps from the node constructor name.
     */
    sym: {
        [name: string]: number;
    };
    /**
     * A lookup table for converting the value in the `sym` mapping back to a string.
     */
    number2symbol: {
        [value: number]: string;
    };
    /**
     * A list of DFAs, where each DFA is a list of
     * states, each state is is a list of arcs, and each
     * arc is a (i, j) pair where i is a label and j is
     * a state number.  The DFA number is the index into
     * this list.  (This name is slightly confusing.)
     * Final states are represented by a special arc of
     * the form (0, j) where j is its own state number.
     */
    states: Dfa[];
}
/**
 *
 */
export declare const ParseTables: Grammar;
