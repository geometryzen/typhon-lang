"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("../pytools/asserts");
var Position_1 = require("../pytools/Position");
var Range_1 = require("../pytools/Range");
// import { RangeMapping } from '../pytools/RangeMapping';
var MutableRange_1 = require("../pytools/MutableRange");
var MutableRange_2 = require("../pytools/MutableRange");
var MappingTree_1 = require("./MappingTree");
var BEGIN_LINE = 1;
var IndentStyle;
(function (IndentStyle) {
    IndentStyle[IndentStyle["None"] = 0] = "None";
    IndentStyle[IndentStyle["Block"] = 1] = "Block";
    IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
})(IndentStyle = exports.IndentStyle || (exports.IndentStyle = {}));
var StackElement = (function () {
    function StackElement(begin, end) {
        this.begin = begin;
        this.end = end;
        this.texts = [];
        this.trees = [];
        // Do nothing yet.
    }
    StackElement.prototype.write = function (text, tree) {
        this.texts.push(text);
        this.trees.push(tree);
    };
    StackElement.prototype.snapshot = function () {
        var texts = this.texts;
        var trees = this.trees;
        var N = texts.length;
        if (N === 0) {
            return { text: '', tree: null };
        }
        else if (N === 1) {
            var text = texts[0];
            var tree = trees[0];
            var line = BEGIN_LINE;
            var beginColumn = 0;
            var endColumn = beginColumn + text.length;
            if (tree) {
                tree.target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(line, beginColumn), new MutableRange_1.MutablePosition(line, endColumn));
                return { text: text, tree: tree };
            }
            else {
                return { text: text, tree: null };
            }
        }
        else {
            var sourceBeginLine = Number.MAX_SAFE_INTEGER;
            var sourceBeginColumn = Number.MAX_SAFE_INTEGER;
            var sourceEndLine = Number.MIN_SAFE_INTEGER;
            var sourceEndColumn = Number.MIN_SAFE_INTEGER;
            var targetBeginLine = Number.MAX_SAFE_INTEGER;
            var children = [];
            var line = BEGIN_LINE;
            var beginColumn = 0;
            for (var i = 0; i < N; i++) {
                var text_1 = texts[i];
                var tree = trees[i];
                var endColumn = beginColumn + text_1.length;
                if (tree) {
                    asserts_1.assert(tree, "mapping must be defined");
                    if (tree.source.begin) {
                        sourceBeginLine = Math.min(sourceBeginLine, tree.source.begin.line);
                        sourceBeginColumn = Math.min(sourceBeginColumn, tree.source.begin.column);
                    }
                    if (tree.source.end) {
                        sourceEndLine = Math.max(sourceEndLine, tree.source.end.line);
                        sourceEndColumn = Math.max(sourceEndColumn, tree.source.end.column);
                    }
                    tree.target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(line, beginColumn), new MutableRange_1.MutablePosition(line, endColumn));
                    children.push(tree);
                }
                beginColumn = endColumn;
            }
            var text = texts.join("");
            if (children.length > 1) {
                var source = new Range_1.Range(new Position_1.Position(sourceBeginLine, sourceBeginColumn), new Position_1.Position(sourceEndLine, sourceEndColumn));
                var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(targetBeginLine, -10), new MutableRange_1.MutablePosition(-10, -10));
                return { text: text, tree: new MappingTree_1.MappingTree(source, target, children) };
            }
            else if (children.length === 1) {
                return { text: text, tree: children[0] };
            }
            else {
                return { text: text, tree: null };
            }
        }
    };
    return StackElement;
}());
function IDXLAST(xs) {
    return xs.length - 1;
}
var Stack = (function () {
    function Stack() {
        this.elements = [];
        this.elements.push(new StackElement('', ''));
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
    function TypeWriter(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        // private readonly buffer: string[] = [];
        this.stack = new Stack();
        // Do nothing.
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
        var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-2, -2), new MutableRange_1.MutablePosition(-2, -2));
        var tree = new MappingTree_1.MappingTree(source, target, null);
        this.stack.write(id, tree);
    };
    TypeWriter.prototype.num = function (text, source) {
        var target = new MutableRange_2.MutableRange(new MutableRange_1.MutablePosition(-3, -3), new MutableRange_1.MutablePosition(-3, -3));
        var tree = new MappingTree_1.MappingTree(source, target, null);
        this.stack.write(text, tree);
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
    TypeWriter.prototype.prolog = function (begin, end) {
        this.stack.push(new StackElement(begin, end));
    };
    TypeWriter.prototype.epilog = function (insertSpaceAfterOpeningAndBeforeClosingNonempty) {
        var popped = this.stack.pop();
        var textAndMappings = popped.snapshot();
        var text = textAndMappings.text;
        var tree = textAndMappings.tree;
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.write(popped.begin, null);
            this.space();
            var rows = 0;
            var cols = popped.begin.length + 1;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.space();
            this.write(popped.end, null);
        }
        else {
            this.write(popped.begin, null);
            var rows = 0;
            var cols = popped.begin.length;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.write(popped.end, null);
        }
    };
    return TypeWriter;
}());
exports.TypeWriter = TypeWriter;
