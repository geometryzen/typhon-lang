import { Tree } from '../btree/btree';
import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';

function rangeComparator(a: Range, b: Range): -1 | 1 | 0 {
    return 0;
}

export class SourceMap {
    private sourceToTarget = new Tree<Range, Range>(rangeComparator);
    private targetToSource = new Tree<Range, Range>(rangeComparator);
    constructor() {
        // Do nothing yet.
    }
    getTargetPosition(sourcePos: Position): Position {
        const sourceRange = new Range(sourcePos, new Position(sourcePos.line, sourcePos.column + 1));
        const targetRange = this.sourceToTarget.get(sourceRange);
        // TODO: Interpolate.
        return sourcePos = targetRange.begin;
    }
    put(source: Range, target: Range): void {
        this.sourceToTarget.put(source, target);
        this.targetToSource.put(target, source);
    }
}
