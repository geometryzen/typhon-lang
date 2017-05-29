import * as tslib_1 from "tslib";
import { OpMap, ParseTables } from './tables';
import { IDXLAST } from './tree';
import { assert } from './asserts';
import { Tokenizer } from './Tokenizer';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
import { grammarName } from './grammarName';
var ParseError = (function (_super) {
    tslib_1.__extends(ParseError, _super);
    function ParseError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ParseError';
        return _this;
    }
    return ParseError;
}(SyntaxError));
export { ParseError };
/**
 * @param message
 * @param begin
 * @param end
 */
function parseError(message, begin, end) {
    var e = new ParseError(message);
    if (Array.isArray(begin)) {
        e.begin = { row: begin[0] - 1, column: begin[1] - 1 };
    }
    if (Array.isArray(end)) {
        e.end = { row: end[0] - 1, column: end[1] - 1 };
    }
    return e;
}
// TODO: The parser does not report whitespace nodes.
// It would be nice if there were an ignoreWhitespace option.
var Parser = (function () {
    /**
     *
     */
    function Parser(grammar) {
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
    /**
     * Add a token; return true if we're done.
     * @param type
     * @param value
     * @param context [start, end, line]
     */
    Parser.prototype.addtoken = function (type, value, context) {
        var ilabel = this.classify(type, value, context);
        OUTERWHILE: while (true) {
            var tp = this.stack[this.stack.length - 1];
            assert(typeof tp === 'object', "stack element must be a StackElement. stack = " + JSON.stringify(this.stack));
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
                    assert(t < 256);
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
            // We've exhaused all the arcs for the for the state.
            if (existsTransition(arcs, [Tokens.T_ENDMARKER, tp.state])) {
                // an accepting state, pop it and try something else
                this.pop();
                if (this.stack.length === 0) {
                    throw parseError("too much input");
                }
            }
            else {
                var found = grammarName(tp.state);
                var begin = context[0];
                var end = context[1];
                throw parseError("Unexpected " + found + " at " + JSON.stringify(begin), begin, end);
            }
        }
    };
    /**
     * turn a token into a label.
     * @param type
     * @param value
     * @param context [begin, end, line]
     */
    Parser.prototype.classify = function (type, value, context) {
        var ilabel;
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
        if (newnode && node.children) {
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
        if (pop) {
            var newnode = pop.node;
            if (newnode) {
                if (this.stack.length !== 0) {
                    var node = this.stack[this.stack.length - 1].node;
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
    };
    return Parser;
}());
/**
 * Finds the specified
 * @param a An array of arrays where each element is an array of two integers.
 * @param obj An array containing two integers.
 */
function existsTransition(a, obj) {
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
 * @param style root of parse tree (optional)
 */
function makeParser(sourceKind) {
    if (sourceKind === undefined)
        sourceKind = SourceKind.File;
    // FIXME: Would be nice to get this typing locked down.
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
    var prefix = "";
    var T_COMMENT = Tokens.T_COMMENT;
    var T_NL = Tokens.T_NL;
    var T_OP = Tokens.T_OP;
    var tokenizer = new Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type, value, start, end, line) {
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
    return function parseFunc(line) {
        var ret = tokenizer.generateTokens(line);
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
    var parseFunc = makeParser(sourceKind);
    // sourceText.endsWith("\n");
    // Why do we normalize the sourceText in this manner?
    if (sourceText.substr(IDXLAST(sourceText), 1) !== "\n") {
        sourceText += "\n";
    }
    // Splitting this ay will create a final line that is the zero-length string.
    var lines = sourceText.split("\n");
    // FIXME: Mixing the types this way is awkward for the consumer.
    var ret = false;
    for (var i = 0; i < lines.length; ++i) {
        // FIXME: Lots of string creation going on here. Why?
        // We're adding back newline characters for all but the last line.
        ret = parseFunc(lines[i] + ((i === IDXLAST(lines)) ? "" : "\n"));
    }
    return ret;
}
export function parseTreeDump(parseTree) {
    function parseTreeDumpInternal(n, indent) {
        var ret = "";
        // non-term
        if (n.type >= 256) {
            ret += indent + ParseTables.number2symbol[n.type] + "\n";
            if (n.children) {
                for (var i = 0; i < n.children.length; ++i) {
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
