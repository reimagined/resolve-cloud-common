// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sync: rimraf } = require('rimraf')

const libPath = path.join(__dirname, 'lib')

const rootPackageJsonPath = path.join(__dirname, 'package.json')

const libPackageJsonPath = path.join(libPath, 'package.json')

rimraf(libPath)

fs.mkdirSync(libPath)

const pkg = JSON.parse(fs.readFileSync(rootPackageJsonPath))
pkg.private = true
delete pkg.devDependencies
delete pkg.scripts
delete pkg.jest
delete pkg.private
fs.writeFileSync(libPackageJsonPath, JSON.stringify(pkg, null, 2))

try {
  execSync(`tsc`, { stdio: 'inherit' })
} catch (error) {
  process.exit(1)
}
