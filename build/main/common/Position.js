"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Position = (function () {
    /**
     *
     */
    function Position(line, column) {
        this.line = line;
        this.column = column;
    }
    Position.prototype.toString = function () {
        return "[" + this.line + ", " + this.column + "]";
    };
    return Position;
}());
exports.Position = Position;
function positionComparator(a, b) {
    if (a.line < b.line) {
        return -1;
    }
    else if (a.line > b.line) {
        return 1;
    }
    else {
        if (a.column < b.column) {
            return -1;
        }
        else if (a.column > b.column) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
exports.positionComparator = positionComparator;
