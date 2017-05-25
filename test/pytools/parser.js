"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tables_1 = require("./tables");
var asserts_1 = require("./asserts");
var base_1 = require("./base");
var Tokenizer_1 = require("./Tokenizer");
var Tokens_1 = require("./Tokens");
var tokenNames_1 = require("./tokenNames");
// low level parser to a concrete syntax tree, derived from cpython's lib2to3
/**
 * @param message
 * @param fileName
 * @param begin
 * @param end
 */
function parseError(message, fileName, begin, end) {
    var e = new SyntaxError(message /*, fileName*/);
    e.name = "ParseError";
    e['fileName'] = fileName;
    if (base_1.isDef(begin)) {
        e['lineNumber'] = begin[0];
        e['columnNumber'] = begin[1];
    }
    return e;
}
var Parser = (function () {
    /**
     *
     * @constructor
     * @param {Object} grammar
     *
     * p = new Parser(grammar);
     * p.setup([start]);
     * foreach input token:
     *     if p.addtoken(...):
     *         break
     * root = p.rootnode
     *
     * can throw ParseError
     */
    function Parser(filename, grammar) {
        this.filename = filename;
        this.grammar = grammar;
        return this;
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
        this.stack = [stackentry];
        this.used_names = {};
    };
    // Add a token; return true if we're done
    Parser.prototype.addtoken = function (type, value, context) {
        var ilabel = this.classify(type, value, context);
        OUTERWHILE: while (true) {
            var tp = this.stack[this.stack.length - 1];
            var states = tp.dfa[0];
            var first = tp.dfa[1];
            var arcs = states[tp.state];
            // look for a state with this label
            for (var a = 0; a < arcs.length; ++a) {
                var i = arcs[a][0];
                var newstate = arcs[a][1];
                var t = this.grammar.labels[i][0];
                // var v = this.grammar.labels[i][1];
                if (ilabel === i) {
                    // look it up in the list of labels
                    asserts_1.assert(t < 256);
                    // shift a token; we're done with it
                    this.shift(type, value, newstate, context);
                    // pop while we are in an accept-only state
                    var state = newstate;
                    while (states[state].length === 1
                        && states[state][0][0] === 0
                        && states[state][0][1] === state) {
                        this.pop();
                        if (this.stack.length === 0) {
                            // done!
                            return true;
                        }
                        tp = this.stack[this.stack.length - 1];
                        state = tp.state;
                        states = tp.dfa[0];
                        first = tp.dfa[1];
                    }
                    // done with this token
                    return false;
                }
                else if (t >= 256) {
                    var itsdfa = this.grammar.dfas[t];
                    var itsfirst = itsdfa[1];
                    if (itsfirst.hasOwnProperty(ilabel)) {
                        // push a symbol
                        this.push(t, this.grammar.dfas[t], newstate, context);
                        continue OUTERWHILE;
                    }
                }
            }
            if (findInDfa(arcs, [0, tp.state])) {
                // an accepting state, pop it and try something else
                this.pop();
                if (this.stack.length === 0) {
                    throw parseError("too much input", this.filename);
                }
            }
            else {
                // no transition
                throw parseError("bad input", this.filename, context[0], context[1]);
            }
        }
    };
    // turn a token into a label
    Parser.prototype.classify = function (type, value, context) {
        var ilabel;
        if (type === Tokens_1.Tokens.T_NAME) {
            this.used_names[value] = true;
            ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];
            if (ilabel) {
                return ilabel;
            }
        }
        ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
        if (!ilabel) {
            throw parseError("bad token", this.filename, context[0], context[1]);
        }
        return ilabel;
    };
    // shift a token
    Parser.prototype.shift = function (type, value, newstate, context) {
        var dfa = this.stack[this.stack.length - 1].dfa;
        // var state = this.stack[this.stack.length - 1].state;
        var node = this.stack[this.stack.length - 1].node;
        var newnode = {
            type: type,
            value: value,
            lineno: context[0][0],
            col_offset: context[0][1],
            children: null
        };
        if (newnode) {
            node.children.push(newnode);
        }
        this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };
    };
    // push a nonterminal
    Parser.prototype.push = function (type, newdfa, newstate, context) {
        var dfa = this.stack[this.stack.length - 1].dfa;
        var node = this.stack[this.stack.length - 1].node;
        this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };
        var newnode = { type: type, value: null, lineno: context[0][0], col_offset: context[0][1], children: [] };
        this.stack.push({ dfa: newdfa, state: 0, node: newnode });
    };
    // pop a nonterminal
    Parser.prototype.pop = function () {
        var pop = this.stack.pop();
        var newnode = pop.node;
        if (newnode) {
            if (this.stack.length !== 0) {
                var node = this.stack[this.stack.length - 1].node;
                node.children.push(newnode);
            }
            else {
                this.rootnode = newnode;
                this.rootnode.used_names = this.used_names;
            }
        }
    };
    return Parser;
}());
/**
 * Finds the specified
 * @param a An array of arrays where each element is an array of two integers.
 * @param obj An array containing two integers.
 */
function findInDfa(a, obj) {
    var i = a.length;
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
 * @param {string} filename
 * @param {string=} style root of parse tree (optional)
 */
function makeParser(filename, style) {
    if (style === undefined)
        style = "file_input";
    var p = new Parser(filename, tables_1.ParseTables);
    // for closure's benefit
    if (style === "file_input")
        p.setup(tables_1.ParseTables.sym.file_input);
    else {
        console.warn("TODO: makeParser(style = " + style + ")");
    }
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var T_COMMENT = Tokens_1.Tokens.T_COMMENT;
    var T_NL = Tokens_1.Tokens.T_NL;
    var T_OP = Tokens_1.Tokens.T_OP;
    var tokenizer = new Tokenizer_1.Tokenizer(filename, style === "single_input", function tokenizerCallback(type, value, start, end, line) {
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
    return function (line) {
        var ret = tokenizer.generateTokens(line);
        if (ret) {
            if (ret !== "done") {
                throw parseError("incomplete input", filename);
            }
            return p.rootnode;
        }
        return false;
    };
}
function parse(filename, input) {
    var parseFunc = makeParser(filename);
    if (input.substr(input.length - 1, 1) !== "\n")
        input += "\n";
    var lines = input.split("\n");
    var ret;
    for (var i = 0; i < lines.length; ++i) {
        ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }
    return ret;
}
exports.parse = parse;
function parseTreeDump(n) {
    var ret = "";
    // non-term
    if (n.type >= 256) {
        ret += tables_1.ParseTables.number2symbol[n.type] + "\n";
        for (var i = 0; i < n.children.length; ++i) {
            ret += parseTreeDump(n.children[i]);
        }
    }
    else {
        ret += tokenNames_1.default[n.type] + ": " + n.value + "\n";
    }
    return ret;
}
exports.parseTreeDump = parseTreeDump;
