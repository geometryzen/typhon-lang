import { OpMap, ParseTables } from './tables';
import { IDXLAST } from './tree';
import { assert } from './asserts';
import { Tokenizer } from './Tokenizer';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
import { grammarName } from './grammarName';
import { parseError } from './syntaxError';

/**
 * Forget about the array wrapper!
 * An Arc is a two-part object consisting a ... and a to-state.
 */
const ARC_SYMBOL_LABEL = 0;
const ARC_TO_STATE = 1;
export type Arc = [number, number];

/**
 * Forget about the array wrapper!
 * A Dfa is a two-part object consisting of:
 * 1. A list of arcs for each state
 * 2. A mapping?
 * Interestingly, the second part does not seem to be used here.
 */
const DFA_STATES = 0;
// const DFA_SECOND = 1;
export type Dfa = [Arc[][], { [value: number]: number }];

/**
 * Describes the shape of the ParseTables objects (which needs to be renamed BTW).
 */
export interface Grammar {
    start: Tokens;
    /**
     *
     */
    dfas: { [value: number]: Dfa };
    /**
     * The index is the symbol for a transition.
     */
    labels: [number, string | null][];
    keywords: { [keyword: string]: number };
    tokens: { [token: number]: number };
    /**
     * Actually maps from the node constructor name.
     */
    sym: { [name: string]: number };
    /**
     * A lookup table for converting the value in the `sym` mapping back to a string.
     */
    number2symbol: { [value: number]: string };
    states: any;
}

export type LineColumn = [number, number];

/**
 * [begin, end, line]
 */
export type ParseContext = [LineColumn, LineColumn, string];

/**
 * The parse tree (not the abstract syntax tree).
 */
export interface PyNode {
    /**
     * For terminals, the type is defined in the Tokens enumeration.
     * For non-terminals, the type is defined in the generated ParseTables.
     */
    type: Tokens;
    value: string | null;
    context?: any;
    lineno?: number;
    col_offset?: number;
    used_names?: { [name: string]: boolean };
    children: PyNode[] | null;
}

export interface StackElement {
    dfa: Dfa;
    state: number;
    node: PyNode;
}

// low level parser to a concrete syntax tree, derived from cpython's lib2to3

// TODO: The parser does not report whitespace nodes.
// It would be nice if there were an ignoreWhitespace option.
class Parser {
    grammar: Grammar;
    stack: StackElement[];
    used_names: { [name: string]: boolean };
    rootnode: PyNode;
    /**
     *
     */
    constructor(grammar: Grammar) {
        this.grammar = grammar;
        return this;
    }
    setup(start?: Tokens): void {
        start = start || this.grammar.start;

        const newnode: PyNode = {
            type: start,
            value: null,
            context: null,
            children: []
        };
        const stackentry: StackElement = {
            dfa: this.grammar.dfas[start],
            state: 0,
            node: newnode
        };
        this.stack = [stackentry];
        this.used_names = {};
    }

    /**
     * Add a token; return true if we're done.
     * @param type
     * @param value
     * @param context [start, end, line]
     */
    addtoken(type: Tokens, value: string, context: ParseContext): boolean {
        /**
         * The symbol for the token being added.
         */
        const tokenSymbol = this.classify(type, value, context);

        OUTERWHILE:
        while (true) {
            let tp = this.stack[this.stack.length - 1];
            assert(typeof tp === 'object', `stack element must be a StackElement. stack = ${JSON.stringify(this.stack)}`);
            let states = tp.dfa[DFA_STATES];
            // This is not being used. Why?
            // let first = tp.dfa[DFA_SECOND];
            const arcs = states[tp.state];

            // look for a to-state with this label
            for (const arc of arcs) {
                const arcSymbol = arc[ARC_SYMBOL_LABEL];
                const newstate = arc[ARC_TO_STATE];
                const t = this.grammar.labels[arcSymbol][0];
                // const v = this.grammar.labels[i][1];
                // console.log(`t => ${t}, v => ${v}`);
                if (tokenSymbol === arcSymbol) {
                    // look it up in the list of labels
                    assert(t < 256);
                    // shift a token; we're done with it
                    this.shift(type, value, newstate, context);
                    // pop while we are in an accept-only state
                    let state = newstate;
                    while (states[state].length === 1 && states[state][0][ARC_SYMBOL_LABEL] === 0 /* Tokens.T_ENDMARKER? */ && states[state][0][ARC_TO_STATE] === state) {
                        this.pop();
                        if (this.stack.length === 0) {
                            // done!
                            return true;
                        }
                        tp = this.stack[this.stack.length - 1];
                        state = tp.state;
                        states = tp.dfa[DFA_STATES];
                        // first = tp.dfa[1];
                    }
                    // done with this token
                    return false;
                }
                else if (t >= 256) {
                    const itsdfa = this.grammar.dfas[t];
                    const itsfirst = itsdfa[1];
                    if (itsfirst.hasOwnProperty(tokenSymbol)) {
                        // push a symbol
                        this.push(t, this.grammar.dfas[t], newstate, context);
                        continue OUTERWHILE;
                    }
                }
            }

            // We've exhaused all the arcs for the for the state.
            if (existsTransition(arcs, [Tokens.T_ENDMARKER, tp.state])) {
                // an accepting state, pop it and try something else
                this.pop();
                if (this.stack.length === 0) {
                    throw parseError("too much input");
                }
            }
            else {
                const found = grammarName(tp.state);
                const begin = context[0];
                const end = context[1];
                throw parseError(`Unexpected ${found} at ${JSON.stringify(begin)}`, begin, end);
            }
        }
    }

    /**
     * Turn a token into a symbol (something that labels an arc in the DFA).
     * The context is only used for error reporting.
     * @param type
     * @param value
     * @param context [begin, end, line]
     */
    classify(type: Tokens, value: string, context: ParseContext): number {
        let ilabel: number | undefined;
        if (type === Tokens.T_NAME) {
            this.used_names[value] = true;
            if (this.grammar.keywords.hasOwnProperty(value)) {
                ilabel = this.grammar.keywords[value];
            }
            if (ilabel) {
                return ilabel;
            }
        }
        if (this.grammar.tokens.hasOwnProperty(type)) {
            ilabel = this.grammar.tokens[type];
        }
        if (!ilabel) {
            throw parseError("bad token", context[0], context[1]);
        }
        return ilabel;
    }

    // shift a token
    shift(type: Tokens, value: string, newstate: number, context: ParseContext): void {
        const dfa = this.stack[this.stack.length - 1].dfa;
        // var state = this.stack[this.stack.length - 1].state;
        const node = this.stack[this.stack.length - 1].node;
        const newnode: PyNode = {
            type: type,
            value: value,
            lineno: context[0][0],
            col_offset: context[0][1],
            children: null
        };
        if (newnode && node.children) {
            node.children.push(newnode);
        }
        this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };
    }

    // push a nonterminal
    push(type: Tokens, newdfa: Dfa, newstate: number, context: ParseContext): void {
        const dfa = this.stack[this.stack.length - 1].dfa;
        const node = this.stack[this.stack.length - 1].node;

        this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };

        const newnode: PyNode = { type: type, value: null, lineno: context[0][0], col_offset: context[0][1], children: [] };

        this.stack.push({ dfa: newdfa, state: 0, node: newnode });
    }

    // pop a nonterminal
    pop(): void {
        const pop = this.stack.pop();
        if (pop) {
            const newnode = pop.node;
            if (newnode) {
                if (this.stack.length !== 0) {
                    const node = this.stack[this.stack.length - 1].node;
                    if (node.children) {
                        node.children.push(newnode);
                    }
                }
                else {
                    this.rootnode = newnode;
                    this.rootnode.used_names = this.used_names;
                }
            }
        }
    }
}



/**
 * Finds the specified
 * @param a An array of arrays where each element is an array of two integers.
 * @param obj An array containing two integers.
 */
function existsTransition(a: Arc[], obj: Arc): boolean {
    let i = a.length;
    while (i--) {
        if (a[i][0] === obj[0] && a[i][1] === obj[1]) {
            return true;
        }
    }
    return false;
}

/**
 * parser for interactive input. returns a function that should be called with
 * lines of input as they are entered. the function will return false
 * until the input is complete, when it will return the rootnode of the parse.
 *
 * @param style root of parse tree (optional)
 */
function makeParser(sourceKind: SourceKind): (line: string) => PyNode | boolean {
    if (sourceKind === undefined) sourceKind = SourceKind.File;

    // FIXME: Would be nice to get this typing locked down.
    const p = new Parser(ParseTables as any);
    // TODO: Can we do this over the symbolic constants?
    switch (sourceKind) {
        case SourceKind.File: {
            p.setup(ParseTables.sym.file_input);
            break;
        }
        case SourceKind.Eval: {
            p.setup(ParseTables.sym.eval_input);
            break;
        }
        case SourceKind.Single: {
            p.setup(ParseTables.sym.single_input);
            break;
        }
        default: {
            throw new Error("SourceKind must be one of File, Eval, or Single.");
        }
    }
    let lineno = 1;
    let column = 0;
    let prefix = "";
    const T_COMMENT = Tokens.T_COMMENT;
    const T_NL = Tokens.T_NL;
    const T_OP = Tokens.T_OP;
    const tokenizer = new Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type: Tokens, value: string, start: [number, number], end: [number, number], line: string): boolean | undefined {
        // var s_lineno = start[0];
        // var s_column = start[1];
        /*
        if (s_lineno !== lineno && s_column !== column)
        {
            // todo; update prefix and line/col
        }
        */
        if (type === T_COMMENT || type === T_NL) {
            prefix += value;
            lineno = end[0];
            column = end[1];
            if (value[value.length - 1] === "\n") {
                lineno += 1;
                column = 0;
            }
            return undefined;
        }
        if (type === T_OP) {
            type = OpMap[value];
        }
        if (p.addtoken(type, value, [start, end, line])) {
            return true;
        }
        return undefined;
    });
    return function parseFunc(line: string): PyNode | boolean {
        const ret = tokenizer.generateTokens(line);
        if (ret) {
            if (ret !== "done") {
                throw parseError("incomplete input");
            }
            return p.rootnode;
        }
        return false;
    };
}

/**
 * Determines the starting point in the grammar for parsing the source.
 */
export enum SourceKind {
    /**
     * Suitable for a module.
     */
    File = 0,
    /**
     * Suitable for execution.
     */
    Eval = 1,
    /**
     * Suitable for a REPL.
     */
    Single = 2
}

export function parse(sourceText: string, sourceKind: SourceKind = SourceKind.File): boolean | PyNode {
    const parseFunc = makeParser(sourceKind);
    // sourceText.endsWith("\n");
    // Why do we normalize the sourceText in this manner?
    if (sourceText.substr(IDXLAST(sourceText), 1) !== "\n") {
        sourceText += "\n";
    }
    // Splitting this ay will create a final line that is the zero-length string.
    const lines = sourceText.split("\n");
    // FIXME: Mixing the types this way is awkward for the consumer.
    let ret: boolean | PyNode = false;
    for (let i = 0; i < lines.length; ++i) {
        // FIXME: Lots of string creation going on here. Why?
        // We're adding back newline characters for all but the last line.
        ret = parseFunc(lines[i] + ((i === IDXLAST(lines)) ? "" : "\n"));
    }
    return ret;
}

export function parseTreeDump(parseTree: PyNode): string {
    function parseTreeDumpInternal(n: PyNode, indent: string): string {
        let ret = "";
        // non-term
        if (n.type >= 256) {
            ret += indent + ParseTables.number2symbol[n.type] + "\n";
            if (n.children) {
                for (let i = 0; i < n.children.length; ++i) {
                    ret += parseTreeDumpInternal(n.children[i], "  " + indent);
                }
            }
        }
        else {
            ret += indent + tokenNames[n.type] + ": " + n.value + "\n";
        }
        return ret;
    }
    return parseTreeDumpInternal(parseTree, "");
}

