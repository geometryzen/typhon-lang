import { MappingTree } from './MappingTree';
import { MutablePosition } from '../pytools/MutableRange';
import { Range } from '../pytools/Range';

export function mapToTarget(m: MappingTree, sourceLine: number, sourceColumn: number): { line: number; column: number } | null {
    if (contains(m.source, sourceLine, sourceColumn)) {
        if (m.children) {
            for (const child of m.children) {
                const pos = mapToTarget(child, sourceLine, sourceColumn);
                if (pos) {
                    return pos;
                }
            }
            return null;
        }
        else {
            const lineOffset = sourceLine - m.source.begin.line;
            const columnOffset = sourceColumn - m.source.begin.column;
            const targetLine = m.target.begin.line + lineOffset;
            const targetColumn = m.target.begin.column + columnOffset;
            return new MutablePosition(targetLine, targetColumn);
        }
    }
    else {
        return null;
    }
}

function contains(range: Range, line: number, column: number): boolean {
    const begin = range.begin;
    const end = range.end;
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
