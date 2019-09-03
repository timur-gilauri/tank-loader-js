const CRLF = '\r\n'
const request = require('sync-request')

module.exports.getYamlArguments = function (args, AMMO_OPTIONS) {
  let result = {}
  for (let arg in args) {
    if (!args.hasOwnProperty(arg)) continue

    if (!AMMO_OPTIONS.includes(arg)) {
      let value = args[arg]
      if (value === 'true') {
        value = true
      }
      if (value === 'false') {
        value = false
      }
      if (arg.includes('.')) {
        let parts = arg.split('.').filter(String)
        if (!parts.length) {
          continue
        }
        if (parts.length > 1) {
          let startProperty = parts.shift()
          let endProperty = parts.pop()

          // skipp options that are haven't to be in .yaml config
          if (AMMO_OPTIONS.includes(startProperty)) {
            continue
          }
          if (!(startProperty in result)) {
            result[startProperty] = {}
          }
          let lastPart = parts.reduce((parent, current) => {
            if (!(current in parent)) {
              parent[current] = {}
            }
            return parent[current]
          }, result[startProperty])
          lastPart[endProperty] = value
        } else {
          result[arg] = value
        }
      } else {
        result[arg] = value
      }
    }
  }
  return result
}

module.exports.prepareHeaders = function (headers) {
  return Object.entries(headers).reduce((result, entry) => {
    return `${result}[${entry.join(':')}]${CRLF}`
  }, ``)
}

module.exports.makeAmmo = function (method, url, headers) {
  return `${headers}${url}`
}

module.exports.makePostAmmo = function (method, url, headers, body) {
  return `${headers}[Content-Length: ${body.length}]${CRLF}${body.length} ${url}${CRLF}${body}${CRLF}`
}

module.exports.authorize = function (url, headers, data, authTokenKeyInResponse) {
  let req = request('POST', url, {
    headers,
    json: JSON.parse(data),
  })
  let response = JSON.parse(req.getBody('utf8'))
  return response[authTokenKeyInResponse]

}

function spread (template, addition) {
  if (!addition) return template

  for (let prop in template) {
    if (template.hasOwnProperty(prop) && addition.hasOwnProperty(prop)) {
      if (typeof template[prop] === 'object') {
        spread(template[prop], addition[prop])
      } else {
        template[prop] = addition[prop]
      }
    }
  }

  for (let key in addition) {
    if (addition.hasOwnProperty(key) && !(key in template)) {
      template[key] = addition[key]
    }
  }
  return template
}

module.exports.spread = spread