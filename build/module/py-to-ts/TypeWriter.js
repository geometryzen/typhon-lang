import { assert } from '../pytools/asserts';
export var IndentStyle;
(function (IndentStyle) {
    IndentStyle[IndentStyle["None"] = 0] = "None";
    IndentStyle[IndentStyle["Block"] = 1] = "Block";
    IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
})(IndentStyle || (IndentStyle = {}));
var StackElement = (function () {
    function StackElement(begin, end) {
        this.begin = begin;
        this.end = end;
        this.buffer = [];
        // Do nothing yet.
    }
    StackElement.prototype.write = function (text) {
        this.buffer.push(text);
    };
    StackElement.prototype.snapshot = function () {
        return this.buffer.join("");
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
    Stack.prototype.write = function (text) {
        this.elements[IDXLAST(this.elements)].write(text);
    };
    Stack.prototype.dispose = function () {
        assert(this.elements.length === 1, "stack length should be 1");
        var text = this.elements[IDXLAST(this.elements)].snapshot();
        this.pop();
        assert(this.elements.length === 0, "stack length should be 0");
        return text;
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
    TypeWriter.prototype.write = function (text) {
        this.stack.write(text);
    };
    TypeWriter.prototype.snapshot = function () {
        assert(this.stack.length === 1, "stack length is not zero");
        var text = this.stack.dispose();
        return text;
    };
    TypeWriter.prototype.binOp = function (binOp) {
        if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
            this.space();
            this.stack.write(binOp);
            this.space();
        }
        else {
            this.stack.write(binOp);
        }
    };
    TypeWriter.prototype.comma = function () {
        this.stack.write(',');
        if (this.options.insertSpaceAfterCommaDelimiter) {
            this.stack.write(' ');
        }
    };
    TypeWriter.prototype.space = function () {
        this.stack.write(' ');
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
        var text = popped.snapshot();
        this.write(popped.begin);
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.space();
            this.write(text);
            this.space();
        }
        else {
            this.write(text);
        }
        this.write(popped.end);
    };
    return TypeWriter;
}());
export { TypeWriter };
