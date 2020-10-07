import { IDX_DFABT_DFA, IDX_DFABT_BEGIN_TOKENS } from './tables';
import { ARC_SYMBOL_LABEL, ARC_TO_STATE, OpMap, ParseTables } from './tables';
import { assert } from '../common/asserts';
import { Tokenizer } from './Tokenizer';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
import { grammarName } from './grammarName';
import { parseError } from '../common/syntaxError';
import { Position } from '../common/Position';
import { Range } from '../common/Range';
import { splitSourceTextIntoLines } from './splitSourceTextIntoLines';
// Dereference certain tokens for performance.
var T_COMMENT = Tokens.T_COMMENT;
var T_ENDMARKER = Tokens.T_ENDMARKER;
var T_NAME = Tokens.T_NAME;
var T_NL = Tokens.T_NL;
var T_NT_OFFSET = Tokens.T_NT_OFFSET;
var T_OP = Tokens.T_OP;
// low level parser to a concrete syntax tree, derived from cpython's lib2to3
// TODO: The parser does not report whitespace nodes.
// It would be nice if there were an ignoreWhitespace option.
var Parser = /** @class */ (function () {
    /**
     *
     */
    function Parser(grammar) {
        this.stack = [];
        this.used_names = {};
        this.grammar = grammar;
    }
    Parser.prototype.setup = function (start) {
        start = start || this.grammar.start;
        var newnode = {
            type: start,
            range: null,
            value: null,
            children: []
        };
        var stackentry = {
            dfa: this.grammar.dfas[start][IDX_DFABT_DFA],
            beginTokens: this.grammar.dfas[start][IDX_DFABT_BEGIN_TOKENS],
            stateId: 0,
            node: newnode
        };
        this.stack.push(stackentry);
    };
    /**
     * Add a token; return true if we're done.
     * @param type
     * @param value
     * @param context [start, end, line]
     */
    Parser.prototype.addtoken = function (type, value, begin, end, line) {
        /**
         * The symbol for the token being added.
         */
        var tokenSymbol = this.classify(type, value, begin, end, line);
        /**
         * Local variable for performance.
         */
        var stack = this.stack;
        // More local variables for performance.
        var g = this.grammar;
        var dfas = g.dfas;
        var labels = g.labels;
        // This code is very performance sensitive.
        OUTERWHILE: while (true) {
            var stackTop = stack[stack.length - 1];
            var dfa = stackTop.dfa;
            // This is not being used. Why?
            // let first = tp.dfa[DFA_SECOND];
            var arcs = dfa[stackTop.stateId];
            // look for a to-state with this label
            for (var _i = 0, arcs_1 = arcs; _i < arcs_1.length; _i++) {
                var arc = arcs_1[_i];
                var arcSymbol = arc[ARC_SYMBOL_LABEL];
                var newState = arc[ARC_TO_STATE];
                var t = labels[arcSymbol][0];
                // const v = labels[arcSymbol][1];
                // console.lg(`t => ${t}, v => ${v}`);
                if (tokenSymbol === arcSymbol) {
                    this.shiftToken(type, value, newState, begin, end, line);
                    // pop while we are in an accept-only state
                    var stateId = newState;
                    /**
                     * Temporary variable to save a few CPU cycles.
                     */
                    var statesOfState = dfa[stateId];
                    while (statesOfState.length === 1 && statesOfState[0][ARC_SYMBOL_LABEL] === 0 && statesOfState[0][ARC_TO_STATE] === stateId) {
                        this.popNonTerminal();
                        // Much of the time we won't be done so cache the stack length.
                        var stackLength = stack.length;
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
                    var dfabt = dfas[t];
                    var dfa_1 = dfabt[IDX_DFABT_DFA];
                    var beginTokens = dfabt[IDX_DFABT_BEGIN_TOKENS];
                    if (beginTokens.hasOwnProperty(tokenSymbol)) {
                        this.pushNonTerminal(t, dfa_1, beginTokens, newState, begin, end, line);
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
                var found = grammarName(stackTop.stateId);
                // FIXME:
                throw parseError("Unexpected " + found + " at " + JSON.stringify([begin[0], begin[1] + 1]), begin, end);
            }
        }
    };
    /**
     * Turn a token into a symbol (something that labels an arc in the DFA).
     * The context is only used for error reporting.
     * @param type
     * @param value
     * @param context [begin, end, line]
     */
    Parser.prototype.classify = function (type, value, begin, end, line) {
        // Assertion commented out for efficiency.
        assertTerminal(type);
        var g = this.grammar;
        if (type === T_NAME) {
            this.used_names[value] = true;
            var keywordToSymbol = g.keywords;
            if (keywordToSymbol.hasOwnProperty(value)) {
                var ilabel_1 = keywordToSymbol[value];
                // assert(typeof ilabel === 'number', "How can it not be?");
                return ilabel_1;
            }
        }
        var tokenToSymbol = g.tokens;
        var ilabel;
        if (tokenToSymbol.hasOwnProperty(type)) {
            ilabel = tokenToSymbol[type];
        }
        if (!ilabel) {
            // console.lg(`ilabel = ${ilabel}, type = ${type}, value = ${value}, begin = ${JSON.stringify(begin)}, end = ${JSON.stringify(end)}`);
            throw parseError("bad token", begin, end);
        }
        return ilabel;
    };
    /**
     * Shifting a token (terminal).
     * 1. A new node is created representing the token.
     * 2. The new node is added as a child to the topmost node on the stack.
     * 3. The state of the topmost element on the stack is updated to be the new state.
     */
    Parser.prototype.shiftToken = function (type, value, newState, begin, end, line) {
        // assertTerminal(type);
        // Local variable for efficiency.
        var stack = this.stack;
        /**
         * The topmost element in the stack is affected by shifting a token.
         */
        var stackTop = stack[stack.length - 1];
        var node = stackTop.node;
        var newnode = {
            type: type,
            value: value,
            range: new Range(new Position(begin[0], begin[1]), new Position(end[0], end[1])),
            children: null
        };
        if (newnode && node.children) {
            node.children.push(newnode);
        }
        stackTop.stateId = newState;
    };
    /**
     * Push a non-terminal symbol onto the stack as a new node.
     * 1. Update the state of the topmost element on the stack to be newState.
     * 2. Push a new element onto the stack corresponding to the symbol.
     * The new stack elements uses the newDfa and has state 0.
     */
    Parser.prototype.pushNonTerminal = function (type, dfa, beginTokens, newState, begin, end, line) {
        // Based on how this function is called, there is really no need for this assertion.
        // Retain it for now while it is not the performance bottleneck.
        // assertNonTerminal(type);
        // Local variable for efficiency.
        var stack = this.stack;
        var stackTop = stack[stack.length - 1];
        stackTop.stateId = newState;
        var beginPos = begin ? new Position(begin[0], begin[1]) : null;
        var endPos = end ? new Position(end[0], end[1]) : null;
        var newnode = { type: type, value: null, range: new Range(beginPos, endPos), children: [] };
        // TODO: Is there a symbolic constant for the zero state?
        stack.push({ dfa: dfa, beginTokens: beginTokens, stateId: 0, node: newnode });
    };
    /**
     * Pop a nonterminal.
     * Popping an element from the stack causes the node to be added to the children of the new top element.
     * The exception is when the stack becomes empty, in which case the node becomes the root node.
     */
    Parser.prototype.popNonTerminal = function () {
        // Local variable for efficiency.
        var stack = this.stack;
        var poppedElement = stack.pop();
        if (poppedElement) {
            var poppedNode = poppedElement.node;
            // Remove this assertion only when it becomes a performance issue.
            // assertNonTerminal(poppedNode.type);
            if (poppedNode) {
                /**
                 * The length of the stack following the pop operation.
                 */
                var N = stack.length;
                if (N !== 0) {
                    var node = stack[N - 1].node;
                    var children = node.children;
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
    };
    return Parser;
}());
/**
 * FIXME: This is O(N). Can we do better?
 * Finds the specified
 * @param a An array of arrays where each element is an array of two integers.
 * @param obj An array containing two integers.
 */
function existsTransition(arcs, obj) {
    var i = arcs.length;
    while (i--) {
        var arc = arcs[i];
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
function makeParser(sourceKind) {
    if (sourceKind === undefined)
        sourceKind = SourceKind.File;
    // FIXME: Would be nice to get this typing locked down. Why does Grammar not match ParseTables?
    var p = new Parser(ParseTables);
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
    var lineno = 1;
    var column = 0;
    // let prefix = "";
    var tokenizer = new Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type, value, start, end, line) {
        var s_lineno = start[0];
        var s_column = start[1];
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
    return function parseFunc(line) {
        var ret = tokenizer.generateTokens(line);
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
export var SourceKind;
(function (SourceKind) {
    /**
     * Suitable for a module.
     */
    SourceKind[SourceKind["File"] = 0] = "File";
    /**
     * Suitable for execution.
     */
    SourceKind[SourceKind["Eval"] = 1] = "Eval";
    /**
     * Suitable for a REPL.
     */
    SourceKind[SourceKind["Single"] = 2] = "Single";
})(SourceKind || (SourceKind = {}));
export function parse(sourceText, sourceKind) {
    if (sourceKind === void 0) { sourceKind = SourceKind.File; }
    var parser = makeParser(sourceKind);
    var lines = splitSourceTextIntoLines(sourceText);
    // FIXME: Mixing the types this way is awkward for the consumer.
    var ret = false;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        ret = parser(line);
    }
    return ret;
}
/**
 * Concrete Syntax Tree
 */
export function cstDump(parseTree) {
    function parseTreeDump(n, indent) {
        var ret = "";
        if (isNonTerminal(n.type)) {
            ret += indent + ParseTables.number2symbol[n.type] + "\n";
            if (n.children) {
                for (var i = 0; i < n.children.length; ++i) {
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
function assertTerminal(type) {
    assert(type < T_NT_OFFSET, "terminal symbols should be less than T_NT_OFFSET");
}
/*
function assertNonTerminal(type: number): void {
    assert(isNonTerminal(type), "non terminal symbols should be greater than or equal to T_NT_OFFSET");
}
*/
function isNonTerminal(type) {
    return type >= T_NT_OFFSET;
}
