import { Expression } from './types';
import { Statement } from './types';
import { PyNode } from './parser';
export declare function astFromExpression(n: PyNode): Expression;
export declare function astFromParse(n: PyNode): Statement[];
export declare function astDump(node: {}): string;
