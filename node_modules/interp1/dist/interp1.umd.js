(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.interp1 = factory());
}(this, (function () { 'use strict';

  /**
   * Finds the index of range in which a query value is included in a sorted
   * array with binary search.
   * @param  xs Array sorted in ascending order.
   * @param  xq Query value.
   * @return    Index of range plus percentage to next index.
   */
  function binaryFindIndex(xs, xq) {
      /* Special case of only one element in array. */
      if (xs.length === 1 && xs[0] === xq)
          return 0;
      /* Determine bounds. */
      var lower = 0;
      var upper = xs.length - 1;
      /* Find index of range. */
      while (lower < upper) {
          /* Determine test range. */
          var mid = Math.floor((lower + upper) / 2);
          var prev = xs[mid];
          var next = xs[mid + 1];
          if (xq < prev) {
              /* Query value is below range. */
              upper = mid;
          }
          else if (xq > next) {
              /* Query value is above range. */
              lower = mid + 1;
          }
          else {
              /* Query value is in range. */
              return mid + (xq - prev) / (next - prev);
          }
      }
      /* Range not found. */
      return -1;
  }
  /**
   * Interpolates a value.
   * @param  vs     Array of values to interpolate between.
   * @param  index  Index of new to be interpolated value.
   * @param  method Kind of interpolation. Can be 'linear', 'nearest', 'next' or 'previous'.
   * @return        Interpolated value.
   */
  function interpolate(vs, index, method) {
      switch (method) {
          case 'nearest': {
              return vs[Math.round(index)];
          }
          case 'next': {
              return vs[Math.ceil(index)];
          }
          case 'previous': {
              return vs[Math.floor(index)];
          }
          case 'linear':
          default: {
              var prev = Math.floor(index);
              var next = Math.ceil(index);
              var lambda = index - prev;
              return (1 - lambda) * vs[prev] + lambda * vs[next];
          }
      }
  }
  /**
   * Interpolates values linearly in one dimension.
   * @param  xs     Array of independent sample points.
   * @param  vs     Array of dependent values v(x) with length equal to xs.
   * @param  xqs    Array of query points.
   * @param  method Method of interpolation.
   * @return        Interpolated values vq(xq) with length equal to xqs.
   */
  function interp1(xs, vs, xqs, method) {
      if (method === void 0) { method = 'linear'; }
      /*
       * Throws an error if number of independent sample points is not equal to
       * the number of dependent values.
       */
      if (xs.length !== vs.length) {
          throw new Error("Arrays of sample points xs and corresponding values vs have to have\n      equal length.");
      }
      /* Combine x and v arrays. */
      var zipped = xs.map(function (x, index) { return [x, vs[index]]; });
      /* Sort points by independent variabel in ascending order. */
      zipped.sort(function (a, b) {
          var diff = a[0] - b[0];
          /* Check if some x value occurs twice. */
          if (diff === 0) {
              throw new Error('Two sample points have equal value ' + a[0] + '. This is not allowed.');
          }
          return diff;
      });
      /* Extract sorted x and v arrays */
      var sortedX = [];
      var sortedV = [];
      for (var i = 0; i < zipped.length; i++) {
          var point = zipped[i];
          sortedX.push(point[0]);
          sortedV.push(point[1]);
      }
      /* Interpolate values */
      var yqs = xqs.map(function (xq) {
          /* Determine index of range of query value. */
          var index = binaryFindIndex(sortedX, xq);
          /* Check if value lies in interpolation range. */
          if (index === -1) {
              throw new Error("Query value " + xq + " lies outside of range. Extrapolation is not\n        supported.");
          }
          /* Interpolate value. */
          return interpolate(sortedV, index, method);
      });
      /* Return result. */
      return yqs.slice();
  }

  return interp1;

})));
//# sourceMappingURL=interp1.umd.js.map
