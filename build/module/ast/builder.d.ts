import { Expression } from './types';
import { Statement } from './types';
import { PyNode } from '../cst/parser';
export declare function astFromExpression(n: PyNode): Expression;
export declare function astFromParse(n: PyNode): Statement[];
export declare function astDump(node: Expression | Statement): string;
