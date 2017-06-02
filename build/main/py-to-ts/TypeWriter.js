"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("../pytools/asserts");
var Position_1 = require("../pytools/Position");
var Range_1 = require("../pytools/Range");
// import { RangeMapping } from '../pytools/RangeMapping';
var MutableRange_1 = require("../pytools/MutableRange");
var MutableRange_2 = require("../pytools/MutableRange");
var MappingTree_1 = require("./MappingTree");
var IndentStyle;
(function (IndentStyle) {
    IndentStyle[IndentStyle["None"] = 0] = "None";
    IndentStyle[IndentStyle["Block"] = 1] = "Block";
    IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
})(IndentStyle = exports.IndentStyle || (exports.IndentStyle = {}));
var StackElement = (function () {
    function StackElement(bMark, eMark, targetBeginLine, targetBeginColumn, trace) {
        this.bMark = bMark;
        this.eMark = eMark;
        this.trace = trace;
        this.texts = [];
        this.trees = [];
        this.cursor = new MutableRange_1.MutablePosition(targetBeginLine, targetBeginColumn);
    }
    /**
     *
     */
    StackElement.prototype.write = function (text, tree) {
        asserts_1.assert(typeof text === 'string', "text must be a string");
        this.texts.push(text);
        this.trees.push(tree);
        var cursor = this.cursor;
        var beginLine = cursor.line;
        var beginColumn = cursor.column;
        var endLine = cursor.line;
        var endColumn = beginColumn + text.length;
        if (tree) {
            tree.target.begin.line = beginLine;
            tree.target.begin.column = beginColumn;
            tree.target.end.line = endLine;
            tree.target.end.column = endColumn;
        }
        cursor.line = endLine;
        cursor.column = endColumn;
    };
    StackElement.prototype.snapshot = function () {
        var texts = this.texts;
        var trees = this.trees;
        var N = texts.length;
        if (N === 0) {
            return this.package('', null);
        }
        else {
            var sBL = Number.MAX_SAFE_INTEGER;
            var sBC = Number.MAX_SAFE_INTEGER;
            var sEL = Number.MIN_SAFE_INTEGER;
            var sEC = Number.MIN_SAFE_INTEGER;
            var tBL = Number.MAX_SAFE_INTEGER;
            var tBC = Number.MAX_SAFE_INTEGER;
            var tEL = Number.MIN_SAFE_INTEGER;
            var tEC = Number.MIN_SAFE_INTEGER;
            var children = [];
            for (var i = 0; i < N; i++) {
                var tree = trees[i];
                if (tree) {
                    sBL = Math.min(sBL, tree.source.begin.line);
                    sBC = Math.min(sBC, tree.source.begin.column);
                    sEL = Math.max(sEL, tree.source.end.line);
                    sEC = Math.max(sEC, tree.source.end.column);
                    tBL = Math.min(tBL, tree.target.begin.line);
                    tBC = Math.min(tBC, tree.target.begin.column);
                    tEL = Math.max(tEL, tree.target.end.line);
                    tEC = Math.max(tEC, tree.target.end.column);
                    if (this.trace) {
                        console.log("txt = " + texts[i]);
                        console.log("tBL = " + tBL);
                        console.log("tBC = " + tBC);
                        console.log("tEL = " + tEL);
                        console.log("tEC = " + tEC);
                    }
                    children.push(tree);
                }
            }
            var text = texts.join("");
            if (children.length > 1) {
                var source = new Range_1.Range(new Position_1.Position(sBL, sBC), new Position_1.Position(sEL, sEC));
                var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(tBL, tBC), new MutableRange_1.MutablePosition(tEL, tEC));
                return this.package(text, new MappingTree_1.MappingTree(source, target, children));
            }
            else if (children.length === 1) {
                return this.package(text, children[0]);
            }
            else {
                return this.package(text, null);
            }
        }
    };
    StackElement.prototype.package = function (text, tree) {
        return { text: text, tree: tree, targetEndLine: this.cursor.line, targetEndColumn: this.cursor.column };
    };
    StackElement.prototype.getLine = function () {
        return this.cursor.line;
    };
    StackElement.prototype.getColumn = function () {
        return this.cursor.column;
    };
    return StackElement;
}());
function IDXLAST(xs) {
    return xs.length - 1;
}
/**
 *
 */
var Stack = (function () {
    function Stack(begin, end, targetLine, targetColumn, trace) {
        this.elements = [];
        this.elements.push(new StackElement(begin, end, targetLine, targetColumn, trace));
    }
    Object.defineProperty(Stack.prototype, "length", {
        get: function () {
            return this.elements.length;
        },
        enumerable: true,
        configurable: true
    });
    Stack.prototype.push = function (element) {
        this.elements.push(element);
    };
    Stack.prototype.pop = function () {
        return this.elements.pop();
    };
    Stack.prototype.write = function (text, tree) {
        this.elements[IDXLAST(this.elements)].write(text, tree);
    };
    Stack.prototype.dispose = function () {
        asserts_1.assert(this.elements.length === 1, "stack length should be 1");
        var textAndMappings = this.elements[IDXLAST(this.elements)].snapshot();
        this.pop();
        asserts_1.assert(this.elements.length === 0, "stack length should be 0");
        return textAndMappings;
    };
    Stack.prototype.getLine = function () {
        return this.elements[IDXLAST(this.elements)].getLine();
    };
    Stack.prototype.getColumn = function () {
        return this.elements[IDXLAST(this.elements)].getColumn();
    };
    return Stack;
}());
/**
 * A smart buffer for writing TypeScript code.
 */
var TypeWriter = (function () {
    /**
     * Determines the indentation.
     */
    // private indentLevel = 0;
    /**
     * Constructs a TypeWriter instance using the specified options.
     */
    function TypeWriter(beginLine, beginColumn, options, trace) {
        if (options === void 0) { options = {}; }
        if (trace === void 0) { trace = false; }
        this.options = options;
        this.trace = trace;
        this.stack = new Stack('', '', beginLine, beginColumn, trace);
    }
    TypeWriter.prototype.assign = function (text, source) {
        var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-3, -3), new MutableRange_1.MutablePosition(-3, -3));
        var tree = new MappingTree_1.MappingTree(source, target, null);
        this.stack.write(text, tree);
    };
    /**
     * Writes a name (identifier).
     * @param id The identifier string to be written.
     * @param begin The position of the beginning of the name in the original source.
     * @param end The position of the end of the name in the original source.
     */
    TypeWriter.prototype.name = function (id, source) {
        if (source) {
            var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-2, -2), new MutableRange_1.MutablePosition(-2, -2));
            var tree = new MappingTree_1.MappingTree(source, target, null);
            this.stack.write(id, tree);
        }
        else {
            this.stack.write(id, null);
        }
    };
    TypeWriter.prototype.num = function (text, source) {
        if (source) {
            var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-3, -3), new MutableRange_1.MutablePosition(-3, -3));
            var tree = new MappingTree_1.MappingTree(source, target, null);
            this.stack.write(text, tree);
        }
        else {
            this.stack.write(text, null);
        }
    };
    /**
     * Currently defined to be for string literals in unparsed form.
     */
    TypeWriter.prototype.str = function (text, source) {
        if (source) {
            var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-23, -23), new MutableRange_1.MutablePosition(-23, -23));
            var tree = new MappingTree_1.MappingTree(source, target, null);
            this.stack.write(text, tree);
        }
        else {
            this.stack.write(text, null);
        }
    };
    TypeWriter.prototype.write = function (text, tree) {
        this.stack.write(text, tree);
    };
    TypeWriter.prototype.snapshot = function () {
        asserts_1.assert(this.stack.length === 1, "stack length is not zero");
        return this.stack.dispose();
    };
    TypeWriter.prototype.binOp = function (binOp, source) {
        var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-5, -5), new MutableRange_1.MutablePosition(-5, -5));
        var tree = new MappingTree_1.MappingTree(source, target, null);
        if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
            this.space();
            this.stack.write(binOp, tree);
            this.space();
        }
        else {
            this.stack.write(binOp, tree);
        }
    };
    TypeWriter.prototype.comma = function (begin, end) {
        if (begin && end) {
            var source = new Range_1.Range(begin, end);
            var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-4, -4), new MutableRange_1.MutablePosition(-4, -4));
            var tree = new MappingTree_1.MappingTree(source, target, null);
            this.stack.write(',', tree);
        }
        else {
            this.stack.write(',', null);
        }
        if (this.options.insertSpaceAfterCommaDelimiter) {
            this.stack.write(' ', null);
        }
    };
    TypeWriter.prototype.space = function () {
        this.stack.write(' ', null);
    };
    TypeWriter.prototype.beginBlock = function () {
        this.prolog('{', '}');
    };
    TypeWriter.prototype.endBlock = function () {
        this.epilog(false);
    };
    TypeWriter.prototype.beginBracket = function () {
        this.prolog('[', ']');
    };
    TypeWriter.prototype.endBracket = function () {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets);
    };
    TypeWriter.prototype.beginObject = function () {
        this.prolog('{', '}');
    };
    TypeWriter.prototype.endObject = function () {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces);
    };
    TypeWriter.prototype.openParen = function () {
        this.prolog('(', ')');
    };
    TypeWriter.prototype.closeParen = function () {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis);
    };
    TypeWriter.prototype.beginQuote = function () {
        this.prolog("'", "'");
    };
    TypeWriter.prototype.endQuote = function () {
        this.epilog(false);
    };
    TypeWriter.prototype.beginStatement = function () {
        this.prolog('', ';');
    };
    TypeWriter.prototype.endStatement = function () {
        this.epilog(false);
    };
    TypeWriter.prototype.prolog = function (bMark, eMark) {
        var line = this.stack.getLine();
        var column = this.stack.getColumn();
        if (this.trace) {
            console.log("prolog(bMark = '" + bMark + "', eMark = '" + eMark + "')");
            console.log("line = " + line + ", column = " + column);
        }
        this.stack.push(new StackElement(bMark, eMark, line, column, this.trace));
    };
    TypeWriter.prototype.epilog = function (insertSpaceAfterOpeningAndBeforeClosingNonempty) {
        var popped = this.stack.pop();
        var textAndMappings = popped.snapshot();
        var text = textAndMappings.text;
        var tree = textAndMappings.tree;
        // This is where we would be
        var line = textAndMappings.targetEndLine;
        var column = textAndMappings.targetEndColumn;
        if (this.trace) {
            console.log("epilog(text = '" + text + "', tree = '" + JSON.stringify(tree) + "')");
            console.log("line = " + line + ", column = " + column);
        }
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.write(popped.bMark, null);
            this.space();
            var rows = 0;
            var cols = popped.bMark.length + 1;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.space();
            this.write(popped.eMark, null);
        }
        else {
            this.write(popped.bMark, null);
            var rows = 0;
            var cols = popped.bMark.length;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.write(popped.eMark, null);
        }
    };
    return TypeWriter;
}());
exports.TypeWriter = TypeWriter;
