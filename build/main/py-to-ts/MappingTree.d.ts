import { Range } from '../pytools/Range';
import { MutableRange } from '../pytools/MutableRange';
/**
 * A tree that enables ranges in the source document to be mapped to ranges in the target document.
 * The ordering of child nodes is not defined.
 * In many cases the children will be in target order owing to the writing process.
 * TODO: For more efficient searching, children should be sorted in source order.
 */
export declare class MappingTree {
    readonly children: MappingTree[];
    /**
     * source is always defined.
     */
    readonly source: Range;
    /**
     * target is always defined.
     */
    readonly target: MutableRange;
    /**
     *
     * @param source
     * @param target
     * @param children
     */
    constructor(source: Range, target: MutableRange, children: MappingTree[]);
    offset(rows: number, cols: number): void;
    mappings(): {
        source: Range;
        target: MutableRange;
    }[];
}
