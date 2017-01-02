const generate = require('babel-generator').default
const t = require('babel-types')
const parse = require('./parser').parse
const traverse = require('./parser').traverse
const helpers = require('./helpers')

const overrideFunctionInClass = (path, resourcePath) => {
  const node = path.node
  const funcName = helpers.getFunctionName(path)
  const classDeclarationPath = helpers.findClassDeclaration(path)
  const className = helpers.getClassName(classDeclarationPath)
  const ast = parse(`
  const old$${className}$${funcName} = ${className}.prototype.${funcName};
  ${className}.prototype.${funcName} = function() {
    console.log('Detect function call:', '"${funcName}"', 'in file:', '${resourcePath}', '${helpers.stringifyStartLocation(node.loc)}');
    return old$${className}$${funcName}.bind(this)();
  };
  `)
  // eslint-disable-next-line
  ast.program.body.reduceRight((_, node) => {
    classDeclarationPath.insertAfter(node)
  }, null)
}

module.exports = function(source, inputSourceMap) {
  // this.cacheable();
  console.log('=======')
  console.log(this.resourcePath)
  const resourcePath = this.resourcePath
  const ast = parse(source)
  const classProperties = []
  traverse(ast, {
    classMethod(node, path) {
      // TODO: get, set
      if (node.kind === 'method') {
        overrideFunctionInClass(path, resourcePath)
      }
    },
    arrowFunctionExpression(node, path) {
      if (helpers.isValueOfClassProperty(path)) {
        const propertyPath = path.parentPath
        const funcName = helpers.getFunctionName(path)
        const className = helpers.getClassName(helpers.findClassDeclaration(propertyPath))
        const alias = `$${className}$${funcName}`

        // avoid invoke loop
        if (classProperties.indexOf(funcName) >= 0 || classProperties.indexOf(alias) >= 0) return
        classProperties.push(alias)

        const oldValue = propertyPath.node.value
        propertyPath.replaceWith(
          t.classProperty(t.identifier(alias), oldValue)
        )
        // console.log(propertyPath)
        // propertyPath.key.name = alias
        const ast = parse(`(
          (...args) => {
            const old = this.${alias};
            console.log('Detect function call:', '"${funcName}"', 'in file:', '${resourcePath}', '${helpers.stringifyStartLocation(node.loc)}');
            return old.apply(this, args);
          }
        )`)
        // console.log(ast)
        propertyPath.insertAfter(t.classProperty(t.identifier(funcName), ast.program.body[0].expression))
        // overrideFunctionInClass(path, resourcePath)
      }
    },
    functionExpression(node, path) {
      if (helpers.isValueOfClassProperty(path)) {
        
      }
    }
  })

  const output = generate(ast, null, source)

  // source = appendResourcePathToSource(this, output.code)

  return output.code
}
