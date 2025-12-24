/*
CORS Anywhere as a Cloudflare Worker!
(c) 2019 by Zibri (www.zibri.org)
email: zibri AT zibri DOT org
https://github.com/Zibri/cloudflare-cors-anywhere

This Cloudflare Worker script acts as a CORS proxy that allows
cross-origin resource sharing for specified origins and URLs.
It handles OPTIONS preflight requests and modifies response headers accordingly to enable CORS.
The script also includes functionality to parse custom headers and provide detailed information
about the CORS proxy service when accessed without specific parameters.
The script is configurable with whitelist and blacklist patterns, although the blacklist feature is currently unused.
The main goal is to facilitate cross-origin requests while enforcing specific security and rate-limiting policies.
*/

// Configuration Examples: Whitelist and Blacklist
// whitelist = [ "^http.?://www.zibri.org$", "zibri.org$", "test\\..*" ];  // regexp for whitelisted urls
// blacklist = []

//--- CLOUDFLARE BINDINGS (ignore if you don't want to use them)
const BINDING_BLACKLIST_NAME = "blacklist"; // Change this to the name of the binding variable that holds your blacklist keys
const BINDING_WHITELIST_NAME = "whitelist"; // Change this to the name of the binding variable that holds your whitelist keys
// Note about Cloudflare bindings: Add whitelist/blacklisted sites to the KEYS, not the values. 
// Note^2 about Cloudflare bindings: If no bindings are found, it defaults to the manual bindings. 
// Note^2.5 about Cloudflare bindings: Created, but empty bindings do not trigger the manual bindings

const BINDING_SETTINGS_NAME = "config"; // Change this to the name of the binding variable that holds your CORS settings
// Note^3 about Cloudflare bindings: Refer to the CONFIG dictionary for the key names to insert into your namespace
// Note^3.5 about Cloudflare bindings: If no bindings are found, it defaults to the manual config bindings

//--- MANUAL CONSTANTS (ignore if you're using Cloudflare bindings)
const MANUAL_WHITELIST_ORIGINS = [".*"]; // Change these if you don't want to set up a binding to whitelist URL Origins
const MANUAL_BLACKLIST_URLS = ["https://thing.com"]; // Change these if you don't want to set up a binding to blacklist URLs

//--- HTML PAGE INFORMATION
const STYLESHEET = ``;  // Do not include <style>, <head>, or <html> boilerplate
const PAGE_HTML = {
  // Do not include <head> or <html> boilerplate
  blacklisted: `Create your own CORS proxy</br>
<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>

Donate</br>
<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a>
`,
  // Does not include customizing usage URL, the IP/Country/Datacenter info, or the custom header info that appears if you pass in any variables
  // To customize the debug information, edit the dictionary on line 504
  homepage: `<h1>CLOUDFLARE-CORS-ANYWHERE</br>
</h1>Source:</br>
<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>

Donate:</br>
<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a></br>

Limits:</br>
 100,000 requests/day&emsp;&emsp;&ensp;          1,000 requests/10 minutes`,
  // Just the readme file formatted into a website (props to https://convertmarkdowntohtml.com/, a random markdown to html converter I found online)
  usage:  `<h1>cloudflare-cors-anywhere</h1>
  <p>Cloudflare CORS proxy in a worker.</p>
  <p>CLOUDFLARE-CORS-ANYWHERE</p>
  <p>Source:<br><a href="https://github.com/Zibri/cloudflare-cors-anywhere">https://github.com/Zibri/cloudflare-cors-anywhere</a></p>
  <p>Demo:<br><a href="https://test.cors.workers.dev">https://test.cors.workers.dev</a></p>
  <p>Donate:<br><a href="https://paypal.me/Zibri/5">https://paypal.me/Zibri/5</a></p>
  <p>Post:<br><a href="http://www.zibri.org/2019/07/your-own-cors-anywhere-proxy-on.html">http://www.zibri.org/2019/07/your-own-cors-anywhere-proxy-on.html</a></p>
  <p>As of December 24th, 2025, this code is able to be deployed without issues to Cloudflare Workers. This repo does not support any production changes to JavaScript or Cloudflare&#39;s Workers beyond that date.</p>
  <p>My personal thanks to Damien Collis for his generous and unique donation.</p>
  <h2>Note about the DEMO URL:</h2>
  <p>Abuse (other than testing) of the demo will result in a ban.<br>The demo accepts only fetch and xmlhttprequest.  </p>
  <p>To create your own is very easy; you just need to set up a Cloudflare account and upload the worker code.  </p>
  <h2>Features</h2>
  <ul>
  <li>Forwards any API method in the REST API spec (GET, PUT, PATCH, POST, and DELETE) </li>
  <li>Status Code mirroring</li>
  <li>Forbidden Header support</li>
  <li>Customizable redirect behavior (infinite follow or don&#39;t follow at all)</li>
  </ul>
  <h2>Deployment</h2>
  <p>This project is written in <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>, and can be easily deployed with <a href="https://developers.cloudflare.com/workers/wrangler/install-and-update/">Wrangler CLI</a>.</p>
  <pre><code class="language-bash">wrangler deploy
  </code></pre>
  <p>If you want to observe the console.log information of your worker outside of preview and quick testing, set <code>enabled</code> to true in the <a href="https://developers.cloudflare.com/workers/observability/logs/workers-logs/#tab-panel-6229">wrangler .toml</a> before deployment, or manually enable Worker Logs in your worker&#39;s settings on Cloudflare&#39;s Dashboard (located under the &quot;observability&quot; section)</p>
  <h3>KV Instances</h3>
  <p>This project supports (but does not require) Cloudflare&#39;s <a href="https://developers.cloudflare.com/kv/get-started/">KV Instances</a> for real-time updating of select variables, eliminating the need for redeployment. Currently, the following variables can be changed through KV namespaces:</p>
  <table>
  <thead>
  <tr>
  <th>Binding Name</th>
  <th>Manual Binding Equivalent</th>
  <th>Notes</th>
  </tr>
  </thead>
  <tbody><tr>
  <td>blacklist</td>
  <td><code>MANUAL_BLACKLIST_URLS</code></td>
  <td>List the URLs as keys in the namespace. Any URL in this list gets its request refused. Supports regexp</td>
  </tr>
  <tr>
  <td>whitelist</td>
  <td><code>MANUAL_WHITELIST_ORIGINS</code></td>
  <td>List the URL origins as keys in the namespace. Any URL origin <em>not</em> in this list will have its request refused. Supports regexp</td>
  </tr>
  <tr>
  <td>config</td>
  <td><code>CONFIG</code></td>
  <td>Currently supports <code>DEBUG</code> and <code>ALLOW_NULL_ORIGINS</code> config keys (case sensitive). Values must be in the form of booleans (either typed out as &quot;true&quot; or &quot;false&quot; (case <strong>in</strong>sensitive)). <code>DEBUG</code> enables console logging of some variables, while <code>ALLOW_NULL_OPTIONS</code> decides whether or not requests from null origins (<code>data://</code>, <code>file://</code>, <code>blob://</code>, or any other requests that do not share their origin) are allowed to send requests through the proxy. If true, any null origin request will be allowed through REGARDLESS OF WHITELIST ORIGIN SETTINGS! </td>
  </tr>
  </tbody></table>
  <p>To use, simply create the KV namespaces in your <a href="https://developers.cloudflare.com/kv/get-started/#tab-panel-841">cloudflare dashboard</a>, then uncomment the bindings code in the wrangler .toml and paste in the namespace IDs that correspond to each binding. </p>
  <p>Note that the KV bindings take precedent over their manual variable counterparts, regardless of if the created KV is empty or not. <strong>This can break the worker if you create an empty whitelist origin KV binding, as it will default to banning every request sent to it.</strong> To avoid this, add <code>.*</code> or your desired regex origin to the keys of the binding before deploying.  </p>
  <p>Alternatively, just edit the manual binding equivalent keys found inside the index.js file</p>
  <h2>Usage Example</h2>
  <pre><code class="language-javascript">fetch(&#39;https://test.cors.workers.dev/?https://httpbin.org/post&#39;, {
    method: &#39;post&#39;,
    headers: {
      &#39;x-foo&#39;: &#39;bar&#39;,
      &#39;x-bar&#39;: &#39;foo&#39;,
      &#39;x-cors-headers&#39;: JSON.stringify({
        // allows to send forbidden headers
        // https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
        &#39;cookies&#39;: &#39;x=123&#39;
      }) 
    }
  }).then(res =&gt; {
    // allows to read all headers (even forbidden headers like set-cookies)
    const headers = JSON.parse(res.headers.get(&#39;cors-received-headers&#39;))
    console.log(headers)
    return res.json()
  }).then(console.log)
  </code></pre>
  <h3>Optional Headers</h3>
  <p>Some CORS-proxy-specific headers you expect to send or receive while requesting data through this proxy</p>
  <table>
  <thead>
  <tr>
  <th>Header</th>
  <th>Send or Received?</th>
  <th>Notes</th>
  </tr>
  </thead>
  <tbody><tr>
  <td>cors-recieved-headers</td>
  <td>Recieved</td>
  <td>Stores all recieved headers</td>
  </tr>
  <tr>
  <td>x-cors-headers</td>
  <td>Send</td>
  <td>Add any forbidden headers you wish to send here</td>
  </tr>
  <tr>
  <td>x-cancel-redirect</td>
  <td>Send</td>
  <td>Stops the CORS proxy from following redirects</td>
  </tr>
  <tr>
  <td>x-final-url</td>
  <td>Received</td>
  <td>If the <code>x-cancel-redirect</code> header is passed, the CORS proxy returns the URL it would have followed under this header</td>
  </tr>
  <tr>
  <td>x-request-url</td>
  <td>Received</td>
  <td>If the <code>x-cancel-redirect</code> header is passed, the CORS proxy returns the URL it got the redirect notice from under this header</td>
  </tr>
  </tbody></table>
  <h2>Known Issues</h2>
  <ul>
  <li>Previewing the proxy in Cloudflare&#39;s preview causes a gateway 502 crash. However, it should function as intended when deployed to production.</li>
  <li>Cannot get around sites that ban requests from Cloudflare</li>
  <li>Cannot be used to query information from Cloudflare or other Cloudflare workers</li>
  <li>Does not support streaming or any request that expects a constant, stable connection between the worker and the target URL</li>
  <li>Has no protections against infinite or lengthy redirect loops</li>
  <li>Has no automatic protections against people abusing the worker (no official rate-limiting code)</li>
  </ul>
  `
};

//--- MANUAL SETTINGS (ignore if you're using Cloudflare bindings)
const CONFIG = {
  DEBUG: false, // Prints debug messages if true, skips them if false
  ALLOW_NULL_ORIGINS: false // "false" bans requests from null origins like `data:` and `file:`. "true" lets null origins through REGARDLESS OF WHAT THE WHITELIST SAYS
};

// index.js
export default {
  async fetch(request, env) {
    const isPreflightRequest = request.method === "OPTIONS";
    const originUrl = new URL(request.url);
    const originHeader = request.headers.get("Origin");
    const connectingIp = request.headers.get("CF-Connecting-IP");
    const blacklistUrls = env[BINDING_BLACKLIST_NAME] || MANUAL_BLACKLIST_URLS; // Internal unformatted blacklist of regexp banned URLs. DO NOT TOUCH!!!
    const whitelistOrigins = env[BINDING_WHITELIST_NAME] || MANUAL_WHITELIST_ORIGINS; // Internal unformatted whitelist of regexp allows URL Origins. DO NOT TOUCH!!!

    let customHeaders = request.headers.get("x-cors-headers"); //Handles "forbidden" headers
    let configDict = env[BINDING_SETTINGS_NAME] || CONFIG; // Unformatted settings dict
    let config = {}; // Formatted settings dict
    let targetUrl; // passed uri URL
    let debug; // Internal Settings flag to activate console.log()/warn() stuff. DO NOT TOUCH!!!
    let allowNullOrigins; // Internal Settings flag to allow/disallow unknown origins. DO NOT TOUCH!!!

    // Converts KV keys into a regular dict. It's not good for anything more than booleans at the moment
    if (typeof configDict.list === "function") {
      for (const key of Object.keys(CONFIG)) {
        const kvVal = await configDict.get(key);
        if (typeof kvVal === "string" && (kvVal.trim().toLowerCase() == "true" || kvVal.trim().toLowerCase() == "false")) {
          config[key] = kvVal.trim().toLowerCase() == "true";
        } else if (kvVal) {
          // This warning can't go under debug because... it's not set yet
          console.warn(`Assigning "${key}" as ${typeof kvVal} "${kvVal}". Was this value saved correctly?`);
          config[key] = kvVal;
        } else {
          config[key] = CONFIG[key]; // Falls back to defualt if key not in the KV Instance
        }
      }
    } else {
      config = configDict;
    }
    // Reassigns debug variables now that the config is properly converted
    debug = config.DEBUG;
    allowNullOrigins = config.ALLOW_NULL_ORIGINS;

    if (debug) { console.log("Configs:", config, "| Debug:", typeof debug, debug, "| AllowNullOrigins:", typeof allowNullOrigins, allowNullOrigins); }

    // Function to check if a given URI or origin is listed in the whitelist or blacklist
    async function isListedInWhitelist(uri, listing) {
      let isListed = false;
      if (debug) { console.log("Blacklist:", blacklistUrls, "| Whitelist:", whitelistOrigins, "| Current:", listing, "uri:", typeof uri, uri); }
      // Compatibility layer to get the right thing
      if (typeof (listing.list) === "function") {
        const listingDict = await listing.list()
        listing = [];
        listingDict.keys.forEach(key => {
          if (key.name && key.name != "") {
            listing.push(key.name);
          }
        });
        if (debug) { console.log("This is a KV list:", listing, "| Listing dict:", listingDict); }
      } else {
        if (debug) { console.log("This is a manual list:", listing); }
      }
      if (typeof uri === "string" && uri != "null") {

        listing.forEach((pattern) => {
          if (uri.match(pattern) !== null) {
            isListed = true;
          }
        });
      } else {
        // When URI is null (e.g., when Origin header is missing), decide based on the implementation
        isListed = allowNullOrigins;
        if (debug) { console.warn("This request has a null origin. Passed:", isListed, typeof isListed); }
      }
      return isListed;
    }

    // Function to modify headers to enable CORS
    function setupCORSHeaders(headers) {
      headers.set("Access-Control-Allow-Origin", request.headers.get("Origin"));
      if (isPreflightRequest) {
        headers.set("Access-Control-Allow-Methods", request.headers.get("access-control-request-method"));
        const requestedHeaders = request.headers.get("access-control-request-headers");
        if (requestedHeaders) {
          headers.set("Access-Control-Allow-Headers", requestedHeaders);
        }
        headers.delete("X-Content-Type-Options"); // Remove X-Content-Type-Options header
      }
      return headers;
    }

    // Function that builds an HTML page based on the passed inputs. Kind of useless on retrospect
    function addHTML(pageHTMLKey, extraText = null) {
      return `
          <DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <style>
                ${STYLESHEET && STYLESHEET != "" ? STYLESHEET : ""}
              </style>
            </head>
            <body>
              ${pageHTMLKey && String(PAGE_HTML[pageHTMLKey]) != "" ? PAGE_HTML[pageHTMLKey] : ""}${extraText && String(extraText) != "" ? extraText : ""}
            </body>
          </html>
          `;
    }

    // Error checking to make sure the passed URL uri is actually a URL
    try {
      targetUrl = new URL(decodeURIComponent(decodeURIComponent(originUrl.search.substring(1))));
    } catch (error) {
      if (originUrl.search.toLowerCase() != "?uri" && originUrl.search.toLowerCase()) {
        return new Response(`{"error": "${error.name}", "message": "Unable to decode given text '${originUrl.search.substring(1)}' into a URL. Is this a real website, and did you include 'http://' or 'https://'?"}`, {
          status: 404,
          statusText: error.statusText || "PageNotFound",
          headers: { "Content-Type": "text/plain" }
        });
      }
    }

    if (debug) { console.log("Target:", targetUrl, "| Origin:", originHeader); }

    // Error checking to make sure the given URL is in the given white/blacklist
    if (targetUrl && await isListedInWhitelist(targetUrl.href, blacklistUrls) || !(await isListedInWhitelist(originHeader, whitelistOrigins))) {
      return new Response(
        addHTML("blacklisted"),
        {
          status: 403,
          statusText: "Forbidden",
          headers: {
            "Content-Type": "text/html"
          }
        }
      );
    }

    // Error checking to make sure the given headers are able to be JSON decoded for use 
    if (customHeaders !== null) {
      try {
        customHeaders = JSON.parse(customHeaders);
      } catch (error) {
        if (debug) {
          console.warn(`Given customHeaders ${customHeaders.toString()} (type ${typeof customHeaders}) failed JSON parsing with the following error:`, error);
        }
      }
    }

    // If block 1: Loads/returns proxied URL request | If block 2: Loads usage page | Else block: Loads homepage
    if (originUrl.search.startsWith("?") && originUrl.search.toLowerCase() != "?uri") {
      const filteredHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (key.match("^origin") === null && key.match("eferer") === null && key.match("^cf-") === null && key.match("^x-forw") === null && key.match("^x-cors-headers") === null) {
          filteredHeaders.set(key, value);
        }
      }
      if (customHeaders !== null) {
        Object.entries(customHeaders).forEach((entry) => filteredHeaders[entry[0]] = entry[1]);
      }
      // If there is an x-cancel-redirect" key, the program won't automatically follow redirects
      let newRequest;
      if (customHeaders && customHeaders["x-cancel-redirect"]) {
        newRequest = new Request(request, { headers: filteredHeaders });
      } else {
        newRequest = new Request(request, { redirect: "follow", headers: filteredHeaders });
      }

      // Error checking to make sure the given URL has fetchable content
      let response, responseBody;
      try {
        response = await fetch(originUrl.search.substring(1), newRequest);
        responseBody = isPreflightRequest ? null : await response.arrayBuffer();
        if (debug) {
          console.log("Target URL:", targetUrl, "Response:", response);
        }
      } catch (error) {
        responseBody = error;
        response = new Response(`{"error": "${error.name}", "message": "${error.message}"}`, {
          status: 400,
          statusText: error.name || "FetchError",
          headers: {}
        });
        if (debug) {
          console.warn("Target URL:", targetUrl, "| Response:", response, "Error:", error.stack);
        }
      }

      // Preps header info to return in cors-recieved-headers
      let responseHeaders = new Headers(response.headers);
      let exposedHeaders = [];
      let allResponseHeaders = {};
      for (const [key, value] of response.headers.entries()) {
        exposedHeaders.push(key);
        allResponseHeaders[key] = value;
      }
      exposedHeaders.push("cors-received-headers");
      responseHeaders = setupCORSHeaders(responseHeaders);
      responseHeaders.set("Access-Control-Expose-Headers", exposedHeaders.join(","));
      responseHeaders.set("cors-received-headers", JSON.stringify(allResponseHeaders));

      // If included an "x-cancel-redirect" header, it'll give back the redirect information in "x-requst-url" and "x-final-url" headers
      if (customHeaders && customHeaders["x-cancel-redirect"]) {
        responseHeaders.set("x-request-url", targetUrl.href);
        responseHeaders.set("x-final-url", response.url);
      }

      if (debug) {
        console.log("Target URL:", targetUrl, "Response Headers:", responseHeaders);
      }

      const responseInit = {
        headers: responseHeaders,
        status: isPreflightRequest ? 200 : response.status,
        statusText: isPreflightRequest ? "OK" : response.statusText
      };
      if (debug) {
        console.log("Target URL:", responseBody, "ResponseInit:", responseInit);
      }

      // Might 502 gateway crash when used in Cloudflare's preview window, but seems to work fine in prod. No idea why...
      return new Response(responseBody, responseInit);
    } else if (originUrl.search.toLowerCase() == "?uri" || originUrl.pathname.toLowerCase() == "/usage") {
      // Sets up and displays usage window (which currently is just the github's readme file)
      let responseHeaders = new Headers();
      responseHeaders = setupCORSHeaders(responseHeaders);
      responseHeaders.set("Content-Type", "text/html");
      return new Response(
        addHTML("usage"),
        {
          status: 200,
          headers: responseHeaders
        }
      );
    } else {
      // Sets up the homepage and the info it prints
      let responseHeaders = new Headers();
      responseHeaders = setupCORSHeaders(responseHeaders);
      responseHeaders.set("Content-Type", "text/html");

      let country;
      let colo;
      let clientData = "";

      if (typeof request.cf !== "undefined") {
        country = request.cf.country;
        colo = request.cf.colo;
      }

      // Controls the debug info printed at the end of the homepage
      const extraText = {
        // HOW TO USE: Key = pre ':' text | Array Val 1 = text | Array Val 2 = truthy to print it or not
        Usage: [`<a href='${originUrl.origin}/?uri'>${originUrl.origin}/?uri</a>`, true],
        Origin: [originHeader, originHeader !== null],
        "x-cors-headers": [JSON.stringify(customHeaders), customHeaders],
        IP: [connectingIp, true],
        Country: [country, country],
        Database: [colo, colo]
      };

      // Does some quick dictionary parsing and flattens out the info. Much more legible this way
      for (const [name, valueList] of Object.entries(extraText)) {
        if (valueList[1]) {
          clientData += "</br>\n\n" + name + ":</br>\n" + valueList[0];
        }
      }

      // Returns the homepage and appends the variable-specific extra stuff to the end
      return new Response(
        addHTML("homepage", clientData),
        {
          status: 200,
          headers: responseHeaders
        }
      );
    }
  }
}//# sourceMappingURL=index.js.map
