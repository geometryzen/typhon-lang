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
export { Position };
export function positionComparator(a, b) {
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
