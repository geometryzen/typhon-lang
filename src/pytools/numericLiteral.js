define([], function()
{
  /**
   * @param {string} s
   */
  function floatAST(s)
  {
    var thing = {};
    thing.text = s;
    thing.value = parseFloat(s);
    thing.isFloat = function() {return true;};
    thing.isInt = function() {return false;};
    thing.isLong = function() {return false;};
    thing.toString = function() {return s;};
    return thing;
  }

  /**
   * @param {number} n
   */
  function intAST(n)
  {
    var thing = {};
    thing.value = n;
    thing.isFloat = function() {return false;};
    thing.isInt = function() {return true;};
    thing.isLong = function() {return false;};
    thing.toString = function() {return '' + n;};
    return thing;
  }

  /**
   * @param {string} s
   */
  function longAST(s, radix)
  {
    var thing = {};
    thing.text = s;
    thing.radix = radix;
    thing.isFloat = function() {return false;};
    thing.isInt = function() {return false;};
    thing.isLong = function() {return true;};
    thing.toString = function() {return s;};
    return thing;
  }

  var that =
  {
    floatAST: floatAST,
    intAST: intAST,
    longAST: longAST
  };
  return that;
});
