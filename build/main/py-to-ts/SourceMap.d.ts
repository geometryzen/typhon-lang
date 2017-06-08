import { RBTree } from 'generic-rbtree';
import { Position } from '../pytools/Position';
export declare class SourceMap {
    private sourceToTarget;
    private targetToSource;
    constructor(sourceToTarget: RBTree<Position, Position>, targetToSource: RBTree<Position, Position>);
    getTargetPosition(sourcePos: Position): Position | null;
    getSourcePosition(targetPos: Position): Position;
}
