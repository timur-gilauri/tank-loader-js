# tank-loader-js
Script that runs yandex-tank with node.js with given params. It works only on linux systems

## Install
Using npm
```npm install```  
By the way, the project contains `shrinkwrap.yaml` file that is for [pnpm](https://github.com/pnpm/pnpm) package manager. 
Using pnpm allows to decrease space usage.

## Schema
`--property=<value>` `--property.any.number.of.nested.props=<value>`

There are basic properties which are not included in any section in .yaml config.  
These are **url** and **headers**.  
The **url** property must be the full url with query params if needed.  
The **headers** can be repeated with different values.  
Substitute prefix before any params for each predefined *yandex-tank* config section. 

## Preflight authorization
You can request authorization before tank will start shooting. 
You have to provide **url**, **headers**, **data**, **tokenName** and **authHeader**(if differs from tokenName) in `auth` section.
Data must contain valid JSON or a String. 
**tokenName** is a token that will be returned from the auth request. 
**authHeader** is a header for request credentials token. If not provided the **tokenName** will be used.

### Basic example

```
--url=http://localhost:9516/rest/account/devices
--headers="session-id":"138ff074-6775-4e10-bf8a-ca8318ff3a54"
--phantom.load_profile.schedule="const(200,1m)"
--phantom.threads=4
--auth.url="http://localhost:9516/rest/auth"
--auth.tokenName="session-id"
--auth.data={{\"user_email\":\"test@test.com\",\"user_password\":\"test\"}
--auth.headers.content-type="application/json"
```