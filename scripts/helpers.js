// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const find = require('glob').sync
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process')

const rootPath = path.join(__dirname, '..')

const ignoreRegExp = /(node_modules|__tests__|__mocks__|\.d\.ts)/
const finishTs = /\.ts$/

module.exports.clear = function() {
  for (const filePath of find('./**/*.ts', {
    cwd: rootPath,
    absolute: true
  })) {
    if (ignoreRegExp.test(filePath)) {
      // eslint-disable-next-line no-continue
      continue
    }
    const baseName = filePath.replace(finishTs, '')
    const files = [`${baseName}.js`, `${baseName}.js.map`, `${baseName}.d.ts`]
    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  }
}

module.exports.compile = function() {
  try {
    execSync(`tsc`, { stdio: 'inherit', cwd: rootPath })
  } catch (error) {
    process.exit(1)
  }
}
