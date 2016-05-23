define(["require", "exports", './pytools/Parser', './pytools/builder', './pytools/sk-compiler'], function (require, exports, Parser_1, builder_1, sk_compiler_1) {
    "use strict";
    /**
     * This file is referenced by the requireJS config.js and pulls in all the other files.
     *
     * We are using the Basic AMD Hybrid Format (John Hann).
     */
    /*
    import core from './pytools/core';
    // import base from './pytools/base';
      var that = require('pytools/core');
    
      // that.base = require('pytools/base');
    
      //that.asserts = require('pytools/asserts');
      that.tables = require('pytools/tables');
      that.astnodes = require('pytools/astnodes');
    
      that.parser = require('pytools/Parser');
      that.builder = require('pytools/builder');
      that.symtable = require('pytools/symtable');
      that.tokenize = require('pytools/Tokenizer');
      that.numericLiteral = require('pytools/numericLiteral');
    
      that.skCompiler = require('pytools/sk-compiler');
    */
    var that = {
        parser: Parser_1.default,
        builder: builder_1.default,
        skCompiler: sk_compiler_1.default
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});
