import { Tree } from '../btree/btree';
import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';
function rangeComparator(a, b) {
    return 0;
}
var SourceMap = (function () {
    function SourceMap() {
        this.sourceToTarget = new Tree(rangeComparator);
        this.targetToSource = new Tree(rangeComparator);
        // Do nothing yet.
    }
    SourceMap.prototype.getTargetPosition = function (sourcePos) {
        var sourceRange = new Range(sourcePos, new Position(sourcePos.line, sourcePos.column + 1));
        var targetRange = this.sourceToTarget.get(sourceRange);
        // TODO: Interpolate.
        return sourcePos = targetRange.begin;
    };
    SourceMap.prototype.put = function (source, target) {
        this.sourceToTarget.put(source, target);
        this.targetToSource.put(target, source);
    };
    return SourceMap;
}());
export { SourceMap };
