define([], function()
{
  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  function fail(message)
  {
    assert(false, message);
  }

  var that =
  {
    assert: assert,
    fail: fail
  };

  return that;
});
