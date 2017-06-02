"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MutablePosition = (function () {
    function MutablePosition(line, column) {
        this.line = line;
        this.column = column;
        // TODO
    }
    MutablePosition.prototype.offset = function (rows, cols) {
        this.line += rows;
        this.column += cols;
    };
    return MutablePosition;
}());
exports.MutablePosition = MutablePosition;
var MutableRange = (function () {
    /**
     *
     */
    function MutableRange(begin, end) {
        this.begin = begin;
        this.end = end;
        this.begin = begin;
        this.end = end;
    }
    MutableRange.prototype.offset = function (rows, cols) {
        this.begin.offset(rows, cols);
        this.end.offset(rows, cols);
    };
    return MutableRange;
}());
exports.MutableRange = MutableRange;
