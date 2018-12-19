function getYamlArguments (args, AMMO_OPTIONS) {
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
        let parts = arg.split('.')
        let section = arg.split('.')[0]

        if (parts.length > 2) {
          let subsection = parts[1]
          let param = parts[2]
          if (!(section in result)) {
            result[section] = {
              [subsection]: {
                [param]: value
              }
            }
          } else {
            if (!(subsection in result[section])) {
              result[section][subsection] = {
                [param]: value
              }
            }
            result[section][subsection][param] = value
          }
        } else {
          let param = parts[1]
          if (!(section in result)) {
            result[section] = {}
          }
          result[section][param] = value
        }
      } else {
        result[arg] = value
      }
    }
  }
  return result
}

function prepareHeaders (headers) {
  let result = ``
  for (let header in headers) {
    if (!headers.hasOwnProperty(header)) continue

    result += `[${header}:${headers[header]}]\n`
  }
  return result
}

function makeAmmo (method, uri, headers) {
  return `${headers}${uri}`
}

function makePostAmmo (method, uri, headers, body) {
  return `${headers}[Content-Length: ${body.length}]${body.length} ${uri}\r\n\r\n${body}`
}

function spread (obj, add) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        spread(obj[key], add[key])
      } else {
        obj[key] = add && add[key] ? add[key] : obj[key]
      }
    }
  }
  if (add) {
    for (let key in add) {
      if (add.hasOwnProperty(key)) {
        if (!(key in obj)) {
          obj[key] = add[key]
        }
      }
    }
  }
  return obj
}

module.exports = {
  getYamlArguments,
  prepareHeaders,
  makeAmmo,
  makePostAmmo,
  spread
}