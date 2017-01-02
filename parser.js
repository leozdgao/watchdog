const babylon = require('babylon')
const t = require('babel-types')
const babelTraverse = require('babel-traverse').default

exports.traverse = (ast, visitors) => {
  return babelTraverse(ast, {
    enter(path) {
      Object.keys(visitors).forEach((key) => {
        const tmp = key.split('')
        tmp[0] = tmp[0].toUpperCase()
        const type = tmp.join('')
        const validator = t[`is${type}`]

        if (validator && validator(path.node)) {
          visitors[key].call(null, path.node, path)
        }
      })
    }
  })
}

exports.parse = (source) => {
  return babylon.parse(source, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'objectRestSpread',
      'classProperties'
    ]
  })
}
