import { Module } from './types';
import { PyNode } from './parser';
export declare function astFromParse(n: PyNode, filename: string): Module;
export declare function astDump(node: Module): string;
