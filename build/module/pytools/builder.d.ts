import { Module } from './types';
import { PyNode } from './parser';
export declare function astFromParse(n: PyNode): Module;
export declare function astDump(node: Module): string;
