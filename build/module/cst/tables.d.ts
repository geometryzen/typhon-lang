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
export declare const ParseTables: {
    sym: {
        AndExpr: number;
        ArithmeticExpr: number;
        AtomExpr: number;
        BitwiseAndExpr: number;
        BitwiseOrExpr: number;
        BitwiseXorExpr: number;
        ComparisonExpr: number;
        ExprList: number;
        ExprStmt: number;
        GeometricExpr: number;
        GlobalStmt: number;
        IfExpr: number;
        ImportList: number;
        ImportSpecifier: number;
        LambdaExpr: number;
        ModuleSpecifier: number;
        NonLocalStmt: number;
        NotExpr: number;
        OrExpr: number;
        PowerExpr: number;
        ShiftExpr: number;
        UnaryExpr: number;
        YieldExpr: number;
        arglist: number;
        argument: number;
        assert_stmt: number;
        augassign: number;
        break_stmt: number;
        classdef: number;
        comp_op: number;
        compound_stmt: number;
        continue_stmt: number;
        decorated: number;
        decorator: number;
        decorators: number;
        del_stmt: number;
        dictmaker: number;
        dotted_as_name: number;
        dotted_as_names: number;
        dotted_name: number;
        encoding_decl: number;
        eval_input: number;
        except_clause: number;
        exec_stmt: number;
        file_input: number;
        flow_stmt: number;
        for_stmt: number;
        fpdef: number;
        fplist: number;
        funcdef: number;
        gen_for: number;
        gen_if: number;
        gen_iter: number;
        if_stmt: number;
        import_from: number;
        import_name: number;
        import_stmt: number;
        list_for: number;
        list_if: number;
        list_iter: number;
        listmaker: number;
        old_LambdaExpr: number;
        old_test: number;
        parameters: number;
        pass_stmt: number;
        print_stmt: number;
        raise_stmt: number;
        return_stmt: number;
        simple_stmt: number;
        single_input: number;
        sliceop: number;
        small_stmt: number;
        stmt: number;
        subscript: number;
        subscriptlist: number;
        suite: number;
        testlist: number;
        testlist1: number;
        testlist_gexp: number;
        testlist_safe: number;
        trailer: number;
        try_stmt: number;
        varargslist: number;
        while_stmt: number;
        with_stmt: number;
        with_var: number;
        yield_stmt: number;
    };
    number2symbol: {
        256: string;
        257: string;
        258: string;
        259: string;
        260: string;
        261: string;
        262: string;
        263: string;
        264: string;
        265: string;
        266: string;
        267: string;
        268: string;
        269: string;
        270: string;
        271: string;
        272: string;
        273: string;
        274: string;
        275: string;
        276: string;
        277: string;
        278: string;
        279: string;
        280: string;
        281: string;
        282: string;
        283: string;
        284: string;
        285: string;
        286: string;
        287: string;
        288: string;
        289: string;
        290: string;
        291: string;
        292: string;
        293: string;
        294: string;
        295: string;
        296: string;
        297: string;
        298: string;
        299: string;
        300: string;
        301: string;
        302: string;
        303: string;
        304: string;
        305: string;
        306: string;
        307: string;
        308: string;
        309: string;
        310: string;
        311: string;
        312: string;
        313: string;
        314: string;
        315: string;
        316: string;
        317: string;
        318: string;
        319: string;
        320: string;
        321: string;
        322: string;
        323: string;
        324: string;
        325: string;
        326: string;
        327: string;
        328: string;
        329: string;
        330: string;
        331: string;
        332: string;
        333: string;
        334: string;
        335: string;
        336: string;
        337: string;
        338: string;
        339: string;
        340: string;
        341: string;
        342: string;
    };
    dfas: {
        256: (number[][][] | {
            2: number;
            4: number;
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            10: number;
            11: number;
            12: number;
            13: number;
            14: number;
            15: number;
            16: number;
            17: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            28: number;
            29: number;
            30: number;
            31: number;
            32: number;
            33: number;
            34: number;
            35: number;
            36: number;
            37: number;
        })[];
        257: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        258: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        259: (number[][][] | {
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            29: number;
        })[];
        260: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        261: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        262: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        263: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        264: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        265: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        266: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        267: (number[][][] | {
            27: number;
        })[];
        268: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        269: (number[][][] | {
            21: number;
        })[];
        270: (number[][][] | {
            21: number;
        })[];
        271: (number[][][] | {
            37: number;
        })[];
        272: (number[][][] | {
            18: number;
        })[];
        273: (number[][][] | {
            13: number;
        })[];
        274: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        275: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        276: (number[][][] | {
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            29: number;
        })[];
        277: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        278: (number[][][] | {
            6: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
        })[];
        279: (number[][][] | {
            26: number;
        })[];
        280: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
            63: number;
            79: number;
        })[];
        281: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        282: (number[][][] | {
            20: number;
        })[];
        283: (number[][][] | {
            86: number;
            87: number;
            88: number;
            89: number;
            90: number;
            91: number;
            92: number;
            93: number;
            94: number;
            95: number;
            96: number;
            97: number;
        })[];
        284: (number[][][] | {
            32: number;
        })[];
        285: (number[][][] | {
            10: number;
        })[];
        286: (number[][][] | {
            7: number;
            99: number;
            100: number;
            101: number;
            102: number;
            103: number;
            104: number;
            105: number;
            106: number;
        })[];
        287: (number[][][] | {
            4: number;
            10: number;
            15: number;
            17: number;
            28: number;
            31: number;
            34: number;
            35: number;
        })[];
        288: (number[][][] | {
            33: number;
        })[];
        289: (number[][][] | {
            34: number;
        })[];
        290: (number[][][] | {
            34: number;
        })[];
        291: (number[][][] | {
            34: number;
        })[];
        292: (number[][][] | {
            22: number;
        })[];
        293: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        294: (number[][][] | {
            21: number;
        })[];
        295: (number[][][] | {
            21: number;
        })[];
        296: (number[][][] | {
            21: number;
        })[];
        297: (number[][][] | {
            21: number;
        })[];
        298: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        299: (number[][][] | {
            123: number;
        })[];
        300: (number[][][] | {
            16: number;
        })[];
        301: (number[][][] | {
            2: number;
            4: number;
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            10: number;
            11: number;
            12: number;
            13: number;
            14: number;
            15: number;
            16: number;
            17: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            28: number;
            29: number;
            30: number;
            31: number;
            32: number;
            33: number;
            34: number;
            35: number;
            36: number;
            37: number;
            122: number;
        })[];
        302: (number[][][] | {
            5: number;
            19: number;
            26: number;
            32: number;
            33: number;
        })[];
        303: (number[][][] | {
            28: number;
        })[];
        304: (number[][][] | {
            21: number;
            29: number;
        })[];
        305: (number[][][] | {
            21: number;
            29: number;
        })[];
        306: (number[][][] | {
            4: number;
        })[];
        307: (number[][][] | {
            28: number;
        })[];
        308: (number[][][] | {
            31: number;
        })[];
        309: (number[][][] | {
            28: number;
            31: number;
        })[];
        310: (number[][][] | {
            31: number;
        })[];
        311: (number[][][] | {
            30: number;
        })[];
        312: (number[][][] | {
            24: number;
        })[];
        313: (number[][][] | {
            24: number;
            30: number;
        })[];
        314: (number[][][] | {
            28: number;
        })[];
        315: (number[][][] | {
            31: number;
        })[];
        316: (number[][][] | {
            28: number;
            31: number;
        })[];
        317: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        318: (number[][][] | {
            37: number;
        })[];
        319: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        320: (number[][][] | {
            29: number;
        })[];
        321: (number[][][] | {
            23: number;
        })[];
        322: (number[][][] | {
            12: number;
        })[];
        323: (number[][][] | {
            5: number;
        })[];
        324: (number[][][] | {
            19: number;
        })[];
        325: (number[][][] | {
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            12: number;
            13: number;
            14: number;
            16: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            29: number;
            30: number;
            32: number;
            33: number;
            36: number;
            37: number;
        })[];
        326: (number[][][] | {
            72: number;
        })[];
        327: (number[][][] | {
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            12: number;
            13: number;
            14: number;
            16: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            29: number;
            30: number;
            32: number;
            33: number;
            36: number;
            37: number;
        })[];
        328: (number[][][] | {
            4: number;
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            10: number;
            11: number;
            12: number;
            13: number;
            14: number;
            15: number;
            16: number;
            17: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            28: number;
            29: number;
            30: number;
            31: number;
            32: number;
            33: number;
            34: number;
            35: number;
            36: number;
            37: number;
        })[];
        329: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
            72: number;
            121: number;
        })[];
        330: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
            72: number;
            121: number;
        })[];
        331: (number[][][] | {
            2: number;
            5: number;
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            12: number;
            13: number;
            14: number;
            16: number;
            18: number;
            19: number;
            20: number;
            21: number;
            22: number;
            23: number;
            24: number;
            25: number;
            26: number;
            27: number;
            29: number;
            30: number;
            32: number;
            33: number;
            36: number;
            37: number;
        })[];
        332: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        333: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        334: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        335: (number[][][] | {
            6: number;
            7: number;
            8: number;
            9: number;
            11: number;
            14: number;
            18: number;
            21: number;
            25: number;
            29: number;
            36: number;
            37: number;
        })[];
        336: (number[][][] | {
            11: number;
            29: number;
            121: number;
        })[];
        337: (number[][][] | {
            15: number;
        })[];
        338: (number[][][] | {
            21: number;
            29: number;
            63: number;
            79: number;
        })[];
        339: (number[][][] | {
            17: number;
        })[];
        340: (number[][][] | {
            35: number;
        })[];
        341: (number[][][] | {
            71: number;
        })[];
        342: (number[][][] | {
            26: number;
        })[];
    };
    states: number[][][][];
    labels: (string | number)[][];
    keywords: {
        'and': number;
        'as': number;
        'assert': number;
        'break': number;
        'class': number;
        'continue': number;
        'def': number;
        'del': number;
        'elif': number;
        'else': number;
        'except': number;
        'exec': number;
        'finally': number;
        'for': number;
        'from': number;
        'global': number;
        'if': number;
        'import': number;
        'in': number;
        'is': number;
        'lambda': number;
        'nonlocal': number;
        'not': number;
        'or': number;
        'pass': number;
        'print': number;
        'raise': number;
        'return': number;
        'try': number;
        'while': number;
        'with': number;
        'yield': number;
    };
    tokens: {
        0: number;
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
        6: number;
        7: number;
        8: number;
        9: number;
        10: number;
        11: number;
        12: number;
        13: number;
        14: number;
        15: number;
        16: number;
        17: number;
        18: number;
        19: number;
        20: number;
        21: number;
        22: number;
        23: number;
        24: number;
        25: number;
        26: number;
        27: number;
        28: number;
        29: number;
        30: number;
        31: number;
        32: number;
        33: number;
        34: number;
        35: number;
        36: number;
        37: number;
        38: number;
        39: number;
        40: number;
        41: number;
        42: number;
        43: number;
        44: number;
        45: number;
        46: number;
        47: number;
        48: number;
        49: number;
        50: number;
        55: number;
    };
    start: number;
};