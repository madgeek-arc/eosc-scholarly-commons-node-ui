// UIkit 3.3.7's LESS source was written for Less 2/3, where a bare `/` is always computed as
// division. Less 4 (the version Angular's browser builder bundles, and which can't be configured
// from angular.json) only computes it inside parentheses, so `round(@table-cell-padding-vertical / 3)`
// reaches round() as an unevaluated `16px / 3` and fails with "argument must be a number".
// This plugin wraps round/floor/ceil to evaluate such a division first. Loaded from _import.less.
functions.addMultiple(
  ['round', 'floor', 'ceil'].reduce(function (wrapped, name) {
    var builtin = less.functions.functionRegistry.get(name);

    function evaluateDivision(context, node) {
      if (node && node.type === 'Operation' && String(node.op).trim() === '/') {
        var left = evaluateDivision(context, node.operands[0]);
        var right = evaluateDivision(context, node.operands[1]);
        return left.operate(context, '/', right);
      }
      return node;
    }

    wrapped[name] = function (value) {
      var rest = Array.prototype.slice.call(arguments, 1);
      return builtin.apply(this, [evaluateDivision(this.context, value)].concat(rest));
    };
    return wrapped;
  }, {})
);
