exports.findClassDeclaration = (path) => {
  const validTypes = [ 'ClassMethod', 'ClassBody', 'ClassProperty' ]

  if (validTypes.indexOf(path.type) >= 0) {
    let parent = path.parentPath
    while(parent.type !== 'Program') {
      if (parent.type === 'ClassDeclaration') return parent
      parent = parent.parentPath
    }
  }

  return null
}

exports.stringifyStartLocation = (loc) => {
  const start = loc.start
  return `line: ${start.line}, column: ${start.column}`
}

exports.isValueOfClassProperty = (path) => {
  return path.parentPath.type === 'ClassProperty'
}

exports.getClassName = (path) => {
  if (path.type === 'ClassDeclaration') {
    return path.node.id.name
  }
}

exports.getFunctionName = (path) => {
  if (path.type === 'ClassMethod') {
    return path.node.key.name
  }
  if (path.type === 'ArrowFunctionExpression' || path.type === 'FunctionExpression') {
    const parent = path.parentPath.node
    const name = (parent.id && parent.id.name) || (parent.key && parent.key.name)

    if (name) return name
    else {
      return (path.node.id && path.node.id.name) || '<anonymous>'
    }
  }
}
