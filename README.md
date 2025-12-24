# cloudflare-cors-anywhere
Cloudflare CORS proxy in a worker.

CLOUDFLARE-CORS-ANYWHERE

Source:
https://github.com/Zibri/cloudflare-cors-anywhere

Demo:
https://test.cors.workers.dev

Donate:
https://paypal.me/Zibri/5

Post:
http://www.zibri.org/2019/07/your-own-cors-anywhere-proxy-on.html

As of December 24th, 2025, this code is able to be deployed without issues to Cloudflare Workers. This repo does not support any production changes to JavaScript or Cloudflare's Workers beyond that date.

My personal thanks to Damien Collis for his generous and unique donation.

## Note about the DEMO URL:

Abuse (other than testing) of the demo will result in a ban.  
The demo accepts only fetch and xmlhttprequest.  

To create your own is very easy; you just need to set up a Cloudflare account and upload the worker code.  
## Features
- Forwards any API method in the REST API spec (GET, PUT, PATCH, POST, and DELETE) 
- Status Code mirroring
- Forbidden Header support
- Customizable redirect behavior (infinite follow or don't follow at all)
## Deployment

This project is written in [Cloudflare Workers](https://workers.cloudflare.com/), and can be easily deployed with [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

```bash
wrangler deploy
```

If you want to observe the console.log information of your worker outside of preview and quick testing, set `enabled` to true in the [wrangler .toml](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#tab-panel-6229) before deployment, or manually enable Worker Logs in your worker's settings on Cloudflare's Dashboard (located under the "observability" section)
### KV Instances
This project supports (but does not require) Cloudflare's [KV Instances](https://developers.cloudflare.com/kv/get-started/) for real-time updating of select variables, eliminating the need for redeployment. Currently, the following variables can be changed through KV namespaces:
|Binding Name|Manual Binding Equivalent|Notes|
|--|--|--|
|  blacklist  |   `MANUAL_BLACKLIST_URLS`  |  List the URLs as keys in the namespace. Any URL in this list gets its request refused. Supports regexp|
|  whitelist  |  `MANUAL_WHITELIST_ORIGINS`|  List the URL origins as keys in the namespace. Any URL origin *not* in this list will have its request refused. Supports regexp|
|  config     |   `CONFIG`                 |  Currently supports `DEBUG` and `ALLOW_NULL_ORIGINS` config keys (case sensitive). Values must be in the form of booleans (either typed out as "true" or "false" (case **in**sensitive)). `DEBUG` enables console logging of some variables, while `ALLOW_NULL_OPTIONS` decides whether or not requests from null origins (`data://`, `file://`, `blob://`, or any other requests that do not share their origin) are allowed to send requests through the proxy. If true, any null origin request will be allowed through REGARDLESS OF WHITELIST ORIGIN SETTINGS! |

To use, simply create the KV namespaces in your [cloudflare dashboard](https://developers.cloudflare.com/kv/get-started/#tab-panel-841), then uncomment the bindings code in the wrangler .toml and paste in the namespace IDs that correspond to each binding. 

Note that the KV bindings take precedent over their manual variable counterparts, regardless of if the created KV is empty or not. **This can break the worker if you create an empty whitelist origin KV binding, as it will default to banning every request sent to it.** To avoid this, add `.*` or your desired regex origin to the keys of the binding before deploying.  

Alternatively, just edit the manual binding equivalent keys found inside the index.js file

## Usage Example

```javascript
fetch('https://test.cors.workers.dev/?https://httpbin.org/post', {
  method: 'post',
  headers: {
    'x-foo': 'bar',
    'x-bar': 'foo',
    'x-cors-headers': JSON.stringify({
      // allows to send forbidden headers
      // https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
      'cookies': 'x=123'
    }) 
  }
}).then(res => {
  // allows to read all headers (even forbidden headers like set-cookies)
  const headers = JSON.parse(res.headers.get('cors-received-headers'))
  console.log(headers)
  return res.json()
}).then(console.log)
```
### Optional Headers
Some CORS-proxy-specific headers you expect to send or receive while requesting data through this proxy
| Header |Send or Received?  |Notes	
|--|--|--|
| cors-recieved-headers | Recieved |	Stores all recieved headers|
| x-cors-headers        |   Send   | Add any forbidden headers you wish to send here
|x-cancel-redirect      |  Send    | Stops the CORS proxy from following redirects
|x-final-url            | Received | If the `x-cancel-redirect` header is passed, the CORS proxy returns the URL it would have followed under this header
|x-request-url          | Received | If the `x-cancel-redirect` header is passed, the CORS proxy returns the URL it got the redirect notice from under this header

## Known Issues
- Previewing the proxy in Cloudflare's preview causes a gateway 502 crash. However, it should function as intended when deployed to production.
- Cannot get around sites that ban requests from Cloudflare
- Cannot be used to query information from Cloudflare or other Cloudflare workers
- Does not support streaming or any request that expects a constant, stable connection between the worker and the target URL
- Has no protections against infinite or lengthy redirect loops
- Has no automatic protections against people abusing the worker (no official rate-limiting code) 
