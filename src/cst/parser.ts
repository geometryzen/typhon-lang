import { BeginTokens, Dfa, DfaAndBeginTokens, IDX_DFABT_DFA, IDX_DFABT_BEGIN_TOKENS } from './tables';
import { Arc, ARC_SYMBOL_LABEL, ARC_TO_STATE, Grammar, OpMap, ParseTables } from './tables';
import { assert } from '../common/asserts';
import { Tokenizer } from './Tokenizer';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
import { grammarName } from './grammarName';
import { parseError, UnexpectedTokenError } from '../common/syntaxError';
import { Position } from '../common/Position';
import { Range } from '../common/Range';
import { splitSourceTextIntoLines } from './splitSourceTextIntoLines';

// Dereference certain tokens for performance.
const T_COMMENT = Tokens.T_COMMENT;
const T_ENDMARKER = Tokens.T_ENDMARKER;
const T_NAME = Tokens.T_NAME;
const T_NL = Tokens.T_NL;
const T_NT_OFFSET = Tokens.T_NT_OFFSET;
const T_OP = Tokens.T_OP;

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

interface StackElement {
    dfa: Dfa;
    beginTokens: BeginTokens;
    stateId: number;
    node: PyNode;
}

// TODO: The parser does not report whitespace nodes.
// It would be nice if there were an ignoreWhitespace option.
/**
 * Low level parser to a concrete syntax tree, derived from cpython's lib2to3.
 */
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

    /**
     * Pushes an element onto the stack of the type specified in the start parameter.
     * @param start Usually ParseTables.sym.file_input or eval_input or single_input. Default is the grammar.start passed in the constructor.
     */
    setup(start?: Tokens): void {
        start = start || this.grammar.start;

        const newnode: PyNode = {
            type: start,
            range: null,
            value: null,
            children: []
        };
        const stackentry: StackElement = {
            dfa: this.grammar.dfas[start][IDX_DFABT_DFA],
            beginTokens: this.grammar.dfas[start][IDX_DFABT_BEGIN_TOKENS],
            stateId: 0,
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
            let stackTop = stack[stack.length - 1];
            let dfa: Dfa = stackTop.dfa;
            // This is not being used. Why?
            // let first = tp.dfa[DFA_SECOND];
            const arcs = dfa[stackTop.stateId];

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
                    let stateId = newState;
                    /**
                     * Temporary variable to save a few CPU cycles.
                     */
                    let statesOfState: [number, number][] = dfa[stateId];
                    while (statesOfState.length === 1 && statesOfState[0][ARC_SYMBOL_LABEL] === 0 && statesOfState[0][ARC_TO_STATE] === stateId) {
                        this.popNonTerminal();
                        // Much of the time we won't be done so cache the stack length.
                        const stackLength = stack.length;
                        if (stackLength === 0) {
                            // done!
                            return true;
                        }
                        else {
                            stackTop = stack[stackLength - 1];
                            stateId = stackTop.stateId;
                            dfa = stackTop.dfa;
                            // first = stackTop.beginTokens;
                            // first = top.dfa[1];
                            statesOfState = dfa[stateId];
                        }
                    }
                    // done with this token
                    return false;
                }
                else if (isNonTerminal(t)) {
                    const dfabt: DfaAndBeginTokens = dfas[t];
                    const dfa: Dfa = dfabt[IDX_DFABT_DFA];
                    const beginTokens: BeginTokens = dfabt[IDX_DFABT_BEGIN_TOKENS];
                    if (beginTokens.hasOwnProperty(tokenSymbol)) {
                        this.pushNonTerminal(t, dfa, beginTokens, newState, begin, end, line);
                        continue OUTERWHILE;
                    }
                }
            }

            // We've exhaused all the arcs for the for the state.
            if (existsTransition(arcs, [T_ENDMARKER, stackTop.stateId])) {
                // an accepting state, pop it and try something else
                this.popNonTerminal();
                if (stack.length === 0) {
                    throw parseError("too much input");
                }
            }
            else {
                const found = grammarName(stackTop.stateId);
                throw new UnexpectedTokenError(`Unexpected ${found} at ${JSON.stringify([begin[0], begin[1] + 1])}`, begin, end);
                // FIXME: We are reporting the column here as 1-based.
                // throw parseError(`Unexpected ${found} at ${JSON.stringify([begin[0], begin[1] + 1])}`, begin, end);
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
        assertTerminal(type);
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
            // console.lg(`ilabel = ${ilabel}, type = ${type}, value = ${value}, begin = ${JSON.stringify(begin)}, end = ${JSON.stringify(end)}`);
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

        stackTop.stateId = newState;
    }

    /**
     * Push a non-terminal symbol onto the stack as a new node.
     * 1. Update the state of the topmost element on the stack to be newState.
     * 2. Push a new element onto the stack corresponding to the symbol.
     * The new stack elements uses the newDfa and has state 0.
     */
    private pushNonTerminal(type: number, dfa: Dfa, beginTokens: BeginTokens, newState: number, begin: LineColumn, end: LineColumn, line: string): void {
        // Based on how this function is called, there is really no need for this assertion.
        // Retain it for now while it is not the performance bottleneck.
        // assertNonTerminal(type);
        // Local variable for efficiency.
        const stack = this.stack;
        const stackTop = stack[stack.length - 1];

        stackTop.stateId = newState;

        const beginPos = begin ? new Position(begin[0], begin[1]) : null;
        const endPos = end ? new Position(end[0], end[1]) : null;
        const newnode: PyNode = { type, value: null, range: new Range(beginPos, endPos), children: [] };

        // TODO: Is there a symbolic constant for the zero state?
        stack.push({ dfa, beginTokens, stateId: 0, node: newnode });
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
 * Constructs a Parser for interactive input.
 * Returns a function that should be called with a single line as input as they are entered.
 * The function will return false until the input is complete, when it will return the rootnode of the parse.
 *
 * @param style root of parse tree (optional)
 */
function makeParser(sourceKind: SourceKind): (line: string) => PyNode | boolean {
    if (sourceKind === undefined) sourceKind = SourceKind.File;

    const p = new Parser(ParseTables);
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
    // let prefix = "";
    const tokenizer = new Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type: Tokens, value: string, start: [number, number], end: [number, number], line: string): boolean | undefined {
        const s_lineno = start[0];
        const s_column = start[1];
        if (s_lineno !== lineno && s_column !== column) {
            // todo; update prefix and line/col
        }
        if (type === T_COMMENT || type === T_NL) {
            // prefix += value;
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

/**
 * Parses the sourceText into a Concrete Syntax Tree (the Parse Tree representation).
 * @param sourceText The source text
 * @param sourceKind The source kind (Default is File).
 * @returns 
 */
export function parse(sourceText: string, sourceKind: SourceKind = SourceKind.File): boolean | PyNode {
    const parser = makeParser(sourceKind);
    const lines = splitSourceTextIntoLines(sourceText);
    // FIXME: Mixing the types this way is awkward for the consumer.
    let ret: boolean | PyNode = false;
    for (const line of lines) {
        ret = parser(line);
    }
    return ret;
}

/**
 * Concrete Syntax Tree
 */
export function cstDump(parseTree: PyNode): string {
    function parseTreeDump(n: PyNode, indent: string): string {
        let ret = "";
        if (isNonTerminal(n.type)) {
            ret += indent + ParseTables.number2symbol[n.type] + "\n";
            if (n.children) {
                for (let i = 0; i < n.children.length; ++i) {
                    ret += parseTreeDump(n.children[i], "  " + indent);
                }
            }
        }
        else {
            ret += indent + tokenNames[n.type] + ": " + n.value + "\n";
        }
        return ret;
    }
    return parseTreeDump(parseTree, "");
}

/**
 * Terminal symbols hsould be less than T_NT_OFFSET.
 * NT_OFFSET means non-terminal offset.
 */

function assertTerminal(type: Tokens): void {
    assert(type < T_NT_OFFSET, "terminal symbols should be less than T_NT_OFFSET");
}

/*
function assertNonTerminal(type: number): void {
    assert(isNonTerminal(type), "non terminal symbols should be greater than or equal to T_NT_OFFSET");
}
*/

function isNonTerminal(type: number): boolean {
    return type >= T_NT_OFFSET;
}

