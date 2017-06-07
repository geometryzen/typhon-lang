import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';
export declare class SourceMap {
    private sourceToTarget;
    private targetToSource;
    constructor();
    getTargetPosition(sourcePos: Position): Position;
    put(source: Range, target: Range): void;
}
