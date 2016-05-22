// see a complete list of options here:
// https://github.com/jrburke/r.js/blob/master/build/example.build.js
requirejs.config({
  // all modules loaded are relative to this path
  // e.g. require(["abc/core"]) would grab /src/abc/core.js
  baseUrl: "./src",

  // specify custom module name paths
  paths: {
    "spec": "../test/spec"
  },

  // target amd loader shim as the main module, path is relative to baseUrl.
  name: "../manual-deps/almond/almond",

  optimize: "none",

  // files to include along with almond.  only pytools is defined, as
  // it pulls in the rest of the dependencies automatically.
  include: ["pytools"],

  // code to wrap around the start / end of the resulting build file
  // the global variable used to expose the API is defined here
  wrap: {
    start: "//\n"+
           "//\n"+
           "//\n"+
           "(\n"+
           "/**\n"+
           " * @param {?*} global\n"+
           " * @param {(function():*)=} define\n"+
           " * @suppress {missingProperties}\n"+
           " */\n"+
           "function(global, define) {\n"+
              // check for amd loader on global namespace
           "  var globalDefine = global.define;\n",

    end:   "  var library = require('pytools');\n"+
           "  /**\n"+
           "   * @suppress {undefinedVars}\n" +
           "   */\n" +
           "  (function() {\n" +
           "    if (typeof module !== 'undefined' && module.exports)\n" +
           "    {\n" +
           "      // export library for node\n" +
           "      module.exports = library;\n" +
           "    }\n"+
           "    else if (globalDefine)\n" +
           "    {\n"+
           "      // define library for global amd loader that is already present\n"+
           "      (function (define) {\n"+
           "        define(function(require, exports, module) {return library;});\n"+
           "      }(globalDefine));\n"+
           "    }\n" +
           "    else\n" +
           "    {\n" +
           "      // define library on global namespace for inline script loading\n"+
           "      global['PYTOOLS'] = library;\n"+
           "    }\n"+
           "  })();\n"+
           "}(/** @type {*} */(this), undefined));\n"
  },

  // don't include coffeescript compiler in optimized file
  stubModules: ["cs","coffee-script"],

  // build file destination, relative to the build file itself
  out: "./dist/pytools.js"
})
