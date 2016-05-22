/**
 * This file is referenced by the requireJS config.js and pulls in all the other files.
 *
 * We are using the Basic AMD Hybrid Format (John Hann).
 */
define(function(require, exports, module)
{
  var that = require('pytools/core');

  that.base = require('pytools/base');

  that.asserts = require('pytools/asserts');
  that.tables = require('pytools/tables');
  that.astnodes = require('pytools/astnodes');

  that.parser = require('pytools/parser');
  that.builder = require('pytools/builder');
  that.symtable = require('pytools/symtable');
  that.tokenize = require('pytools/tokenize');
  that.numericLiteral = require('pytools/numericLiteral');

  that.skCompiler = require('pytools/sk-compiler');

  return that;
});
