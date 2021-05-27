[![Build Status](https://github.com/Symmetronic/interp1/workflows/build/badge.svg?branch=master)](https://github.com/Symmetronic/interp1/actions?query=workflow%3Abuild+branch%3Amaster) [![Coverage Status](https://coveralls.io/repos/github/Symmetronic/interp1/badge.svg?branch=master)](https://coveralls.io/github/Symmetronic/interp1?branch=master) [![GitHub License](https://img.shields.io/github/license/Symmetronic/interp1)](https://github.com/Symmetronic/interp1/blob/master/LICENSE) [![NPM Version](https://img.shields.io/npm/v/interp1)](https://www.npmjs.com/package/interp1) [![Monthly Downloads](https://img.shields.io/npm/dm/interp1)](https://npmcharts.com/compare/interp1?minimal=true)

# interp1

[MATLAB-inspired](https://www.mathworks.com/help/matlab/ref/interp1.html) 1-dimensional data interpolation.

## Importing this function

### Node Modules

- Run `npm install interp1`
- Add an import to the npm package `import interp1 from 'interp1';`
- Then you can use the function in your code.

### CDN

- Put the following script tag `<script src='https://cdn.jsdelivr.net/npm/interp1@1/dist/interp1.umd.min.js'></script>` in the head of your index.html
- Then you can use the function in your code.

## API

```javascript
vqs = interp1(xs, vs, xqs);
vqs = interp1(xs, vs, xqs, method);
```

The function takes the following arguments:

- `xs`: Array of independent sample points. No value may occur more than once.
- `vs`: Array of dependent values v(x) with length equal to xs.
- `xqs`: Array of query points.
- `method`: Method of interpolation: `linear`, `nearest`, `next` or `previous`. Defaults to `linear`.

It returns an array of interpolated values `vqs`, corresponding to the query values `xqs`.

## Example

```javascript
var vqs = interp1(
  [1, 2, 3],
  [-4, 6, 3],
  [1, 1.5, 2.5],
  'linear',
);
console.log(vqs);
// expected output: Array [-4, 1, 4.5]
```

## NPM scripts

- `npm install`: Install dependencies
- `npm test`: Run test suite
- `npm start`: Run `npm run build` in watch mode
- `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
- `npm run test:prod`: Run linting and generate coverage
- `npm run build`: Generate bundles and typings, create docs
- `npm run lint`: Lints code
