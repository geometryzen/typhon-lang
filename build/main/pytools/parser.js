"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tables_1 = require("./tables");
var tree_1 = require("./tree");
// import { assert } from './asserts';
var Tokenizer_1 = require("./Tokenizer");
var Tokens_1 = require("./Tokens");
var tokenNames_1 = require("./tokenNames");
var grammarName_1 = require("./grammarName");
var syntaxError_1 = require("./syntaxError");
// Dereference certain tokens for performance.
var T_COMMENT = Tokens_1.Tokens.T_COMMENT;
var T_ENDMARKER = Tokens_1.Tokens.T_ENDMARKER;
var T_NAME = Tokens_1.Tokens.T_NAME;
var T_NL = Tokens_1.Tokens.T_NL;
var T_NT_OFFSET = Tokens_1.Tokens.T_NT_OFFSET;
var T_OP = Tokens_1.Tokens.T_OP;
/**
 * Forget about the array wrapper!
 * An Arc is a two-part object consisting a ... and a to-state.
 */
var ARC_SYMBOL_LABEL = 0;
var ARC_TO_STATE = 1;
/**
 * Forget about the array wrapper!
 * A Dfa is a two-part object consisting of:
 * 1. A list of arcs for each state
 * 2. A mapping?
 * Interestingly, the second part does not seem to be used here.
 */
var DFA_STATES = 0;
// low level parser to a concrete syntax tree, derived from cpython's lib2to3
// TODO: The parser does not report whitespace nodes.
// It would be nice if there were an ignoreWhitespace option.
var Parser = (function () {
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
            value: null,
            context: null,
            children: []
        };
        var stackentry = {
            dfa: this.grammar.dfas[start],
            state: 0,
            node: newnode
        };
        this.stack.push(stackentry);
        //        this.used_names = {};
    };
    /**
     * Add a token; return true if we're done.
     * @param type
     * @param value
     * @param context [start, end, line]
     */
    Parser.prototype.addtoken = function (type, value, context) {
        /**
         * The symbol for the token being added.
         */
        var tokenSymbol = this.classify(type, value, context);
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
            var top_1 = stack[stack.length - 1];
            var states = top_1.dfa[DFA_STATES];
            // This is not being used. Why?
            // let first = tp.dfa[DFA_SECOND];
            var arcs = states[top_1.state];
            // look for a to-state with this label
            for (var _i = 0, arcs_1 = arcs; _i < arcs_1.length; _i++) {
                var arc = arcs_1[_i];
                var arcSymbol = arc[ARC_SYMBOL_LABEL];
                var newState = arc[ARC_TO_STATE];
                var t = labels[arcSymbol][0];
                // const v = labels[arcSymbol][1];
                // console.log(`t => ${t}, v => ${v}`);
                if (tokenSymbol === arcSymbol) {
                    this.shiftToken(type, value, newState, context);
                    // pop while we are in an accept-only state
                    var state = newState;
                    /**
                     * Temporary variable to save a few CPU cycles.
                     */
                    var statesOfState = states[state];
                    while (statesOfState.length === 1 && statesOfState[0][ARC_SYMBOL_LABEL] === 0 && statesOfState[0][ARC_TO_STATE] === state) {
                        this.popNonTerminal();
                        // Much of the time we won't be done so cache the stack length.
                        var stackLength = stack.length;
                        if (stackLength === 0) {
                            // done!
                            return true;
                        }
                        else {
                            top_1 = stack[stackLength - 1];
                            state = top_1.state;
                            states = top_1.dfa[DFA_STATES];
                            // first = top.dfa[1];
                            statesOfState = states[state];
                        }
                    }
                    // done with this token
                    return false;
                }
                else if (isNonTerminal(t)) {
                    var dfa = dfas[t];
                    var itsfirst = dfa[1];
                    if (itsfirst.hasOwnProperty(tokenSymbol)) {
                        this.pushNonTerminal(t, dfa, newState, context);
                        continue OUTERWHILE;
                    }
                }
            }
            // We've exhaused all the arcs for the for the state.
            if (existsTransition(arcs, [T_ENDMARKER, top_1.state])) {
                // an accepting state, pop it and try something else
                this.popNonTerminal();
                if (stack.length === 0) {
                    throw syntaxError_1.parseError("too much input");
                }
            }
            else {
                var found = grammarName_1.grammarName(top_1.state);
                var begin = context[0];
                var end = context[1];
                throw syntaxError_1.parseError("Unexpected " + found + " at " + JSON.stringify(begin), begin, end);
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
    Parser.prototype.classify = function (type, value, context) {
        // Assertion commented out for efficiency.
        // assertTerminal(type);
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
            throw syntaxError_1.parseError("bad token", context[0], context[1]);
        }
        return ilabel;
    };
    /**
     * Shifting a token (terminal).
     * 1. A new node is created representing the token.
     * 2. The new node is added as a child to the topmost node on the stack.
     * 3. The state of the topmost element on the stack is updated to be the new state.
     */
    Parser.prototype.shiftToken = function (type, value, newState, context) {
        // assertTerminal(type);
        // Local variable for efficiency.
        var stack = this.stack;
        /**
         * The topmost element in the stack is affected by shifting a token.
         */
        var stackTop = stack[stack.length - 1];
        // const dfa = stackTop.dfa;
        // const oldState = stackTop.state;
        var node = stackTop.node;
        // TODO: Since this is a token, why don't we keep more of the context (even if some redundancy).
        // Further, is the value the raw text?
        var begin = context[0];
        var newnode = {
            type: type,
            value: value,
            lineno: begin[0],
            col_offset: begin[1],
            children: null
        };
        if (newnode && node.children) {
            node.children.push(newnode);
        }
        // TODO: Is it necessary to replace the topmost stack element with a new object.
        // Can't we simply update the state?
        // console.log(`oldState = ${oldState} => newState = ${newState}`);
        // New Code:
        stackTop.state = newState;
        // Old Code:
        // this.stack[this.stack.length - 1] = { dfa: dfa, state: newState, node: node };
    };
    /**
     * Push a non-terminal symbol onto the stack as a new node.
     * 1. Update the state of the topmost element on the stack to be newState.
     * 2. Push a new element onto the stack corresponding to the symbol.
     * The new stack elements uses the newDfa and has state 0.
     */
    Parser.prototype.pushNonTerminal = function (type, newDfa, newState, context) {
        // Based on how this function is called, there is really no need for this assertion.
        // Retain it for now while it is not the performance bottleneck.
        // assertNonTerminal(type);
        // Local variable for efficiency.
        var stack = this.stack;
        var stackTop = stack[stack.length - 1];
        // const dfa = stackTop.dfa;
        // const node = stackTop.node;
        // New Code:
        stackTop.state = newState;
        // Old Code
        // stack[stack.length - 1] = { dfa: dfa, state: newState, node: node };
        // TODO: Why don't we retain more of the context? Is `end` not appropriate?
        var begin = context[0];
        var newnode = { type: type, value: null, lineno: begin[0], col_offset: begin[1], children: [] };
        // TODO: Is there a symbolic constant for the zero state?
        stack.push({ dfa: newDfa, state: 0, node: newnode });
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
    var p = new Parser(tables_1.ParseTables);
    // TODO: Can we do this over the symbolic constants?
    switch (sourceKind) {
        case SourceKind.File: {
            p.setup(tables_1.ParseTables.sym.file_input);
            break;
        }
        case SourceKind.Eval: {
            p.setup(tables_1.ParseTables.sym.eval_input);
            break;
        }
        case SourceKind.Single: {
            p.setup(tables_1.ParseTables.sym.single_input);
            break;
        }
        default: {
            throw new Error("SourceKind must be one of File, Eval, or Single.");
        }
    }
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var tokenizer = new Tokenizer_1.Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type, value, start, end, line) {
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
            type = tables_1.OpMap[value];
        }
        if (p.addtoken(type, value, [start, end, line])) {
            return true;
        }
        return undefined;
    });
    return function parseFunc(line) {
        var ret = tokenizer.generateTokens(line);
        if (ret) {
            if (ret !== "done") {
                throw syntaxError_1.parseError("incomplete input");
            }
            return p.rootNode;
        }
        return false;
    };
}
/**
 * Determines the starting point in the grammar for parsing the source.
 */
var SourceKind;
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
})(SourceKind = exports.SourceKind || (exports.SourceKind = {}));
function parse(sourceText, sourceKind) {
    if (sourceKind === void 0) { sourceKind = SourceKind.File; }
    var parseFunc = makeParser(sourceKind);
    // sourceText.endsWith("\n");
    // Why do we normalize the sourceText in this manner?
    if (sourceText.substr(tree_1.IDXLAST(sourceText), 1) !== "\n") {
        sourceText += "\n";
    }
    // Splitting this ay will create a final line that is the zero-length string.
    var lines = sourceText.split("\n");
    // FIXME: Mixing the types this way is awkward for the consumer.
    var ret = false;
    var N = lines.length;
    for (var i = 0; i < N; ++i) {
        // FIXME: Lots of string creation going on here. Why?
        // We're adding back newline characters for all but the last line.
        ret = parseFunc(lines[i] + ((i === tree_1.IDXLAST(lines)) ? "" : "\n"));
    }
    return ret;
}
exports.parse = parse;
function parseTreeDump(parseTree) {
    function parseTreeDumpInternal(n, indent) {
        var ret = "";
        if (isNonTerminal(n.type)) {
            ret += indent + tables_1.ParseTables.number2symbol[n.type] + "\n";
            if (n.children) {
                for (var i = 0; i < n.children.length; ++i) {
                    ret += parseTreeDumpInternal(n.children[i], "  " + indent);
                }
            }
        }
        else {
            ret += indent + tokenNames_1.tokenNames[n.type] + ": " + n.value + "\n";
        }
        return ret;
    }
    return parseTreeDumpInternal(parseTree, "");
}
exports.parseTreeDump = parseTreeDump;
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
function isNonTerminal(type) {
    return type >= T_NT_OFFSET;
}
