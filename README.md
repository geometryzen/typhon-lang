# pytools

Python Tools for Scanning, Parsing, Semantic Analysis, and Code Generation.

Based on the SPARK tool chain:

http://pages.cpsc.ucalgary.ca/~aycock/spark/

## Build

### Installation

```
npm install
```

```
bower install
```

```
./build.py help
```

### Generate parser

```
./build.py gen
```

### Compile TypeScript to JavaScript

```
tsc
```

### Jasmine Unit Test, Bundle, Uglify.

```
grunt
```

## How it Works

The `build.py` command `gen` generates two files used for scanning and parsing.

### ParserGenerator in pgen

The following process is used to generate a parser.

`src/pgen/parser/main.py` has embedded within it the grammar file which contains a BNF grammar.

`src/pgen/parser/main.py` is executed by the python interpreter to produce `tables.js`.

`src/pytools/tables.js`: Tokens and the DFA.

These tables are used by the Parser class to 

### Scanning/Lexical Analysis (creates token stream)

### Parsing/Syntax Analysis (builds AST)


### Semantic Analysis

`symtable.js` seems to be involved here.

### Compilation/Code Generation

`sk-compiler.js` is the compiler that produces Skulpt code.

## Comments

It seems like there is some overlap in Python.asdl and the grammar-*.txt file?

