import { MutablePosition } from '../pytools/MutableRange';
export function mapToTarget(m, sourceLine, sourceColumn) {
    if (contains(m.source, sourceLine, sourceColumn)) {
        if (m.children) {
            for (var _i = 0, _a = m.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var pos = mapToTarget(child, sourceLine, sourceColumn);
                if (pos) {
                    return pos;
                }
            }
            return null;
        }
        else {
            var lineOffset = sourceLine - m.source.begin.line;
            var columnOffset = sourceColumn - m.source.begin.column;
            var targetLine = m.target.begin.line + lineOffset;
            var targetColumn = m.target.begin.column + columnOffset;
            return new MutablePosition(targetLine, targetColumn);
        }
    }
    else {
        return null;
    }
}
function contains(range, line, column) {
    var begin = range.begin;
    var end = range.end;
    if (line > begin.line) {
        if (line < end.line) {
            return true;
        }
        else if (line === end.line) {
            return column < end.column;
        }
        else {
            return false;
        }
    }
    else if (line === begin.line) {
        if (line < end.line) {
            return column >= begin.column;
        }
        else if (line === end.line) {
            return column >= begin.column && column < end.column;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
