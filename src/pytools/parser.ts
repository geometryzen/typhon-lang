import { OpMap, ParseTables } from './tables';
import { IDXLAST } from './tree';
// import { assert } from './asserts';
import { Tokenizer } from './Tokenizer';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
import { grammarName } from './grammarName';
import { parseError } from './syntaxError';
import { Position } from './Position';
import { Range } from './Range';

// Dereference certain tokens for performance.
const T_COMMENT = Tokens.T_COMMENT;
const T_ENDMARKER = Tokens.T_ENDMARKER;
const T_NAME = Tokens.T_NAME;
const T_NL = Tokens.T_NL;
const T_NT_OFFSET = Tokens.T_NT_OFFSET;
const T_OP = Tokens.T_OP;

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
     * The first index is the symbol for a transition (a number).
     * The second index is the haman-readable decode of the symbol, if it exists, otherwise `null`.
     * Not all symbols have human-readable names.
     * All symbols that have human-readable names are keywords, with one exception.
     * The symbol 0 (zero) is an exceptional symbol and has the human-readavble name 'EMPTY'.
     */
    labels: [number, string | null][];
    /**
     * A mapping from a keyword to the symbol that has been assigned to it.
     */
    keywords: { [keyword: string]: number };
    /**
     * A mapping from a token to a symbol.
     */
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

/**
 * The first element is the line number.
 * The line number is 1-based.
 * The second element is the column.
 * The column is 0-based.
 */
export type LineColumn = [number, number];

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
    range: Range | null;
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
    private readonly grammar: Grammar;
    private readonly stack: StackElement[] = [];
    private readonly used_names: { [name: string]: boolean } = {};
    rootNode: PyNode;
    /**
     *
     */
    constructor(grammar: Grammar) {
        this.grammar = grammar;
    }

    setup(start?: Tokens): void {
        start = start || this.grammar.start;

        const newnode: PyNode = {
            type: start,
            range: null,
            value: null,
            children: []
        };
        const stackentry: StackElement = {
            dfa: this.grammar.dfas[start],
            state: 0,
            node: newnode
        };
        this.stack.push(stackentry);
    }

    /**
     * Add a token; return true if we're done.
     * @param type
     * @param value
     * @param context [start, end, line]
     */
    addtoken(type: Tokens, value: string, begin: LineColumn, end: LineColumn, line: string): boolean {
        /**
         * The symbol for the token being added.
         */
        const tokenSymbol = this.classify(type, value, begin, end, line);
        /**
         * Local variable for performance.
         */
        const stack = this.stack;
        // More local variables for performance.
        const g = this.grammar;
        const dfas = g.dfas;
        const labels = g.labels;

        // This code is very performance sensitive.
        OUTERWHILE:
        while (true) {
            let top = stack[stack.length - 1];
            let states = top.dfa[DFA_STATES];
            // This is not being used. Why?
            // let first = tp.dfa[DFA_SECOND];
            const arcs = states[top.state];

            // look for a to-state with this label
            for (const arc of arcs) {
                const arcSymbol = arc[ARC_SYMBOL_LABEL];
                const newState = arc[ARC_TO_STATE];
                const t = labels[arcSymbol][0];
                // const v = labels[arcSymbol][1];
                // console.lg(`t => ${t}, v => ${v}`);
                if (tokenSymbol === arcSymbol) {
                    this.shiftToken(type, value, newState, begin, end, line);
                    // pop while we are in an accept-only state
                    let state = newState;
                    /**
                     * Temporary variable to save a few CPU cycles.
                     */
                    let statesOfState: [number, number][] = states[state];
                    while (statesOfState.length === 1 && statesOfState[0][ARC_SYMBOL_LABEL] === 0 && statesOfState[0][ARC_TO_STATE] === state) {
                        this.popNonTerminal();
                        // Much of the time we won't be done so cache the stack length.
                        const stackLength = stack.length;
                        if (stackLength === 0) {
                            // done!
                            return true;
                        }
                        else {
                            top = stack[stackLength - 1];
                            state = top.state;
                            states = top.dfa[DFA_STATES];
                            // first = top.dfa[1];
                            statesOfState = states[state];
                        }
                    }
                    // done with this token
                    return false;
                }
                else if (isNonTerminal(t)) {
                    const dfa = dfas[t];
                    const itsfirst = dfa[1];
                    if (itsfirst.hasOwnProperty(tokenSymbol)) {
                        this.pushNonTerminal(t, dfa, newState, begin, end, line);
                        continue OUTERWHILE;
                    }
                }
            }

            // We've exhaused all the arcs for the for the state.
            if (existsTransition(arcs, [T_ENDMARKER, top.state])) {
                // an accepting state, pop it and try something else
                this.popNonTerminal();
                if (stack.length === 0) {
                    throw parseError("too much input");
                }
            }
            else {
                const found = grammarName(top.state);
                // FIXME:
                throw parseError(`Unexpected ${found} at ${JSON.stringify([begin[0], begin[1] + 1])}`, begin, end);
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
    private classify(type: Tokens, value: string, begin: LineColumn, end: LineColumn, line: string): number {
        // Assertion commented out for efficiency.
        // assertTerminal(type);
        const g = this.grammar;
        if (type === T_NAME) {
            this.used_names[value] = true;
            const keywordToSymbol = g.keywords;
            if (keywordToSymbol.hasOwnProperty(value)) {
                const ilabel = keywordToSymbol[value];
                // assert(typeof ilabel === 'number', "How can it not be?");
                return ilabel;
            }
        }
        const tokenToSymbol = g.tokens;
        let ilabel: number | undefined;
        if (tokenToSymbol.hasOwnProperty(type)) {
            ilabel = tokenToSymbol[type];
        }
        if (!ilabel) {
            throw parseError("bad token", begin, end);
        }
        return ilabel;
    }

    /**
     * Shifting a token (terminal).
     * 1. A new node is created representing the token.
     * 2. The new node is added as a child to the topmost node on the stack.
     * 3. The state of the topmost element on the stack is updated to be the new state.
     */
    private shiftToken(type: Tokens, value: string, newState: number, begin: LineColumn, end: LineColumn, line: string): void {
        // assertTerminal(type);
        // Local variable for efficiency.
        const stack = this.stack;
        /**
         * The topmost element in the stack is affected by shifting a token.
         */
        const stackTop = stack[stack.length - 1];

        const node = stackTop.node;
        const newnode: PyNode = {
            type: type,
            value: value,
            range: new Range(new Position(begin[0], begin[1]), new Position(end[0], end[1])),
            children: null
        };
        if (newnode && node.children) {
            node.children.push(newnode);
        }

        stackTop.state = newState;
    }

    /**
     * Push a non-terminal symbol onto the stack as a new node.
     * 1. Update the state of the topmost element on the stack to be newState.
     * 2. Push a new element onto the stack corresponding to the symbol.
     * The new stack elements uses the newDfa and has state 0.
     */
    private pushNonTerminal(type: number, newDfa: Dfa, newState: number, begin: LineColumn, end: LineColumn, line: string): void {
        // Based on how this function is called, there is really no need for this assertion.
        // Retain it for now while it is not the performance bottleneck.
        // assertNonTerminal(type);
        // Local variable for efficiency.
        const stack = this.stack;
        const stackTop = stack[stack.length - 1];

        stackTop.state = newState;

        const beginPos = begin ? new Position(begin[0], begin[1]) : null;
        const endPos = end ? new Position(end[0], end[1]) : null;
        const newnode: PyNode = { type, value: null, range: new Range(beginPos, endPos), children: [] };

        // TODO: Is there a symbolic constant for the zero state?
        stack.push({ dfa: newDfa, state: 0, node: newnode });
    }

    /**
     * Pop a nonterminal.
     * Popping an element from the stack causes the node to be added to the children of the new top element.
     * The exception is when the stack becomes empty, in which case the node becomes the root node.
     */
    private popNonTerminal(): void {
        // Local variable for efficiency.
        const stack = this.stack;
        const poppedElement = stack.pop();
        if (poppedElement) {
            const poppedNode = poppedElement.node;
            // Remove this assertion only when it becomes a performance issue.
            // assertNonTerminal(poppedNode.type);
            if (poppedNode) {
                /**
                 * The length of the stack following the pop operation.
                 */
                const N = stack.length;
                if (N !== 0) {
                    const node = stack[N - 1].node;
                    const children = node.children;
                    if (children) {
                        children.push(poppedNode);
                    }
                }
                else {
                    // If the length of the stack following the pop is zero then the popped element becomes the root node.
                    this.rootNode = poppedNode;
                    poppedNode.used_names = this.used_names;
                }
            }
        }
    }
}



/**
 * FIXME: This is O(N). Can we do better?
 * Finds the specified
 * @param a An array of arrays where each element is an array of two integers.
 * @param obj An array containing two integers.
 */
function existsTransition(arcs: Arc[], obj: Arc): boolean {
    let i = arcs.length;
    while (i--) {
        const arc = arcs[i];
        if (arc[ARC_SYMBOL_LABEL] === obj[ARC_SYMBOL_LABEL] && arc[ARC_TO_STATE] === obj[ARC_TO_STATE]) {
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

    // FIXME: Would be nice to get this typing locked down. Why does Grammar not match ParseTables?
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

        // FIXME: We're creating an array object here for every token.
        if (p.addtoken(type, value, start, end, line)) {
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
            return p.rootNode;
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
    const N = lines.length;
    for (let i = 0; i < N; ++i) {
        // FIXME: Lots of string creation going on here. Why?
        // We're adding back newline characters for all but the last line.
        ret = parseFunc(lines[i] + ((i === IDXLAST(lines)) ? "" : "\n"));
    }
    return ret;
}

export function parseTreeDump(parseTree: PyNode): string {
    function parseTreeDumpInternal(n: PyNode, indent: string): string {
        let ret = "";
        if (isNonTerminal(n.type)) {
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

/**
 * Terminal symbols hsould be less than T_NT_OFFSET.
 * NT_OFFSET means non-terminal offset.
 */
/*
function assertTerminal(type: Tokens): void {
    assert(type < T_NT_OFFSET, "terminal symbols should be less than T_NT_OFFSET");
}
*/
/*
function assertNonTerminal(type: number): void {
    assert(isNonTerminal(type), "non terminal symbols should be greater than or equal to T_NT_OFFSET");
}
*/

function isNonTerminal(type: number): boolean {
    return type >= T_NT_OFFSET;
}

