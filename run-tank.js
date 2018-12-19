const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')
const urlParse = require('url-parse')
const readYaml = require('read-yaml')
const writeYaml = require('write-yaml')
const loadTemplate = readYaml.sync(path.resolve(__dirname, './loadTemplate.yaml'))
const loadYamlName = 'load.yaml'
const ammofile = 'ammo.txt'
let {getYamlArguments, prepareHeaders, makeAmmo, makePostAmmo, spread} = require('./functions')

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
let uri = url.pathname

let body = args.body
let method = args.method
args.headers['Host'] = address
let headers = prepareHeaders(args.headers)
if (!method && body) {
  method = 'post'
} else if (!method && !body) {
  method = 'get'
}

// Добавялем в конфиг параметры запроса
resultYaml['phantom'] = {
  ...resultYaml['phantom'],
  ammofile, address, ssl, port,
}

let ammo = 'body' in args ? makePostAmmo(method, uri, headers, body) : makeAmmo(method, uri, headers)

try {
  fs.writeFileSync(path.resolve(__dirname, `./${ammofile}`), ammo)
  writeYaml.sync(path.resolve(__dirname, `./${loadYamlName}`), resultYaml)
} catch (e) {
  console.log(`error when write load ${e}`)
}

const tank = spawn('yandex-tank', ['-c', loadYamlName])

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
    fs.unlinkSync(path.resolve(__dirname, `./${ammofile}`))
    fs.unlinkSync(path.resolve(__dirname, `./${loadYamlName}`))
  } catch (e) {
    console.log(`error when deleting load files`)
  }
})