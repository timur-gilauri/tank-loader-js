#! /usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const {spawn} = require('child_process')
const urlParse = require('url-parse')
const readYaml = require('read-yaml')
const writeYaml = require('write-yaml')

// Path
const tmp = os.tmpdir()
const testDirPrefix = 'tank-test-'
const testDir = fs.mkdtempSync(path.join(tmp, testDirPrefix))
const logsBaseDirPath = path.join(testDir, 'logs')
const logsDirPath = path.join(logsBaseDirPath, '/')
const srcPath = path.resolve(__dirname, './src/')
const loadTemplate = readYaml.sync(path.join(srcPath, 'template.yaml'))
const {getYamlArguments, prepareHeaders, makeAmmo, makePostAmmo, spread} = require(path.join(srcPath, 'functions'))

const ammofile = 'ammo.txt'
const loadYamlName = 'load.yaml'
const ammofilePath = path.join(testDir, ammofile)
const loadYamlPath = path.join(testDir, loadYamlName)

const AMMO_OPTIONS = ['uri', 'headers', 'body', 'method']

let args = process.argv.filter(arg => arg.startsWith('--')).reduce((result, arg) => {
  let pair = arg.split('=')
  let key = pair[0].slice(2)
  let value = pair[1]
  if (key === 'headers') {
    if (!(key in result)) {
      result[key] = {}
    }
    let header = value.split(':')[0]
    result[key][header] = value.split(':')[1]
  } else {
    result[key] = value
  }
  return result
}, {})

let yamlArguments = getYamlArguments(args, AMMO_OPTIONS)

let resultYaml = spread(loadTemplate, yamlArguments)

let url = urlParse(args.uri, true)
let ssl = url.protocol.startsWith('https')
let address = url.hostname
let port = ssl ? '443' : '80'
let uri = url.pathname ? url.pathname : '/'
let body = args.body
let method = 'body' in args ? 'post' : 'get'
let ammo_type = 'body' in args ? 'uripost' : 'uri'

if (!('headers' in args)) {
  args.headers = {}
}
args.headers['Host'] = address

let headers = prepareHeaders(args.headers)

// Добавялем в конфиг параметры запроса
resultYaml['core'] = {
  artifacts_base_dir: logsBaseDirPath,
  artifacts_dir: logsDirPath
}
resultYaml['phantom'] = {
  ...resultYaml['phantom'],
  ammofile: ammofilePath,
  cache_dir: testDir,
  ammo_type, address, ssl, port,
}

let ammo = 'body' in args ? makePostAmmo(method, uri, headers, body) : makeAmmo(method, uri, headers)

try {
  fs.writeFileSync(ammofilePath, ammo)
  writeYaml.sync(loadYamlPath, resultYaml)
} catch (e) {
  console.log(`error when write load ${e}`)
}

const tank = spawn('yandex-tank', ['-c', loadYamlPath])

console.log('Starting tank')

tank.stdout.on('data', function (data) {
  console.log(data.toString())
})

tank.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`)
})

tank.on('close', (code) => {
  console.log(`child process exited with code ${code}`)
  try {
    fs.rmdirSync(testDir)
  } catch (e) {
    console.log(`error when deleting load files`, e)
  }
})