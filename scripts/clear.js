// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const find = require('glob').sync
// eslint-disable-next-line @typescript-eslint/no-var-requires

const rootPath = path.join(__dirname, '..')

const ignoreRegExp = /(node_modules|__tests__|__mocks__|\.d\.ts)/
const finishTs = /\.ts$/

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
