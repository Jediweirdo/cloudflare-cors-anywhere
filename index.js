(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // index.js
  (() => {
    var __defProp2 = Object.defineProperty;
    var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
    var blacklistUrls = [];
    var whitelistOrigins = [".*"];
    var debug = true;
    var styleSheet = ``; // Do not include <style>, <head>, or <html> boilerplate. If blank or null, it is ignored.
    var pageHTML = {  // Do not include <head> or <html> boilerplate
      blacklisted: `Create your own CORS proxy</br>\n<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>\n\nDonate</br>\n<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a>\n`,
      // Does not include customizing usage URL, the IP/Country/Datacenter info, or the custom header info that appears if you pass any in
      homepage: `<h1>CLOUDFLARE-CORS-ANYWHERE</br>\n</h1>Source:</br>\n<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>\n\nDonate:</br>\n<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a></br>\n\nLimits:</br>\n 100,000 requests/day&emsp;&emsp;&ensp;          1,000 requests/10 minutes`,
      // Just the readme file formatted into a website (props to a random markdown to html converter I found online)
      usage: `
        <h1>cloudflare-cors-anywhere</h1>
        <p>Cloudflare CORS proxy in a worker.</p>
      
        <p>CLOUDFLARE-CORS-ANYWHERE</p>
      
        <p><strong>Source:</strong><br>
          <a href="https://github.com/Zibri/cloudflare-cors-anywhere">https://github.com/Zibri/cloudflare-cors-anywhere</a>
        </p>
      
        <p><strong>Demo:</strong><br>
          <a href="https://test.cors.workers.dev">https://test.cors.workers.dev</a>
        </p>
      
        <p><strong>Donate:</strong><br>
          <a href="https://paypal.me/Zibri/5">https://paypal.me/Zibri/5</a>
        </p>
      
        <p><strong>Post:</strong><br>
          <a href="http://www.zibri.org/2019/07/your-own-cors-anywhere-proxy-on.html">
            http://www.zibri.org/2019/07/your-own-cors-anywhere-proxy-on.html
          </a>
        </p>
      
        <h2>Deployment</h2>
        <p>
          This project is written in
          <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>,
          and can be easily deployed with
          <a href="https://developers.cloudflare.com/workers/wrangler/install-and-update/">Wrangler CLI</a>.
        </p>
      
        <pre><code class="language-bash">wrangler deploy
      </code></pre>
      
        <h2>Usage Example</h2>
      
        <pre><code class="language-javascript">fetch('https://test.cors.workers.dev/?https://httpbin.org/post', {
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
      }).then(res =&gt; {
        // allows to read all headers (even forbidden headers like set-cookies)
        const headers = JSON.parse(res.headers.get('cors-received-headers'))
        console.log(headers)
        return res.json()
      }).then(console.log)
      </code></pre>
      
        <p><strong>Note:</strong></p>
        <p>All received headers are also returned in &quot;cors-received-headers&quot; header.</p>
      
        <p><strong>Note about the DEMO url:</strong></p>
        <p>Abuse (other than testing) of the demo will result in a ban.<br>
           The demo accepts only fetch and xmlhttprequest.
        </p>
      
        <p>
          To create your own is very easy, you just need to set up a cloudflare account and upload the worker code.
        </p>
      
        <p>My personal thanks to Damien Collis for his generous and unique donation.</p>
      </body>`
    } //TODO: add pageHTML for internal 500 errors and maybe the bad URL error

    function isListedInWhitelist(uri, listing) {
      let isListed = false;
      if (typeof uri === "string") {
        listing.forEach((pattern) => {
          if (uri.match(pattern) !== null) {
            isListed = true;
          }
        });
      } else {
        isListed = true;
      }
      return isListed;
    }
    __name(isListedInWhitelist, "isListedInWhitelist");
    __name2(isListedInWhitelist, "isListedInWhitelist");
    addEventListener("fetch", async (event) => {
      event.respondWith((async function () {
        const isPreflightRequest = event.request.method === "OPTIONS";
        const originUrl = new URL(event.request.url);
        function setupCORSHeaders(headers) {
          headers.set("Access-Control-Allow-Origin", event.request.headers.get("Origin"));
          if (isPreflightRequest) {
            headers.set("Access-Control-Allow-Methods", event.request.headers.get("access-control-request-method"));
            const requestedHeaders = event.request.headers.get("access-control-request-headers");
            if (requestedHeaders) {
              headers.set("Access-Control-Allow-Headers", requestedHeaders);
            }
            headers.delete("X-Content-Type-Options");
          }
          return headers;
        }
        // makes a simple HTML page based on the pageHTML key and additional body text given
        function addHTML(pageHTMLKey, extraText = null) {
          return `
          <DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <style>
                ${styleSheet && styleSheet != "" ? styleSheet : ""}
              </style>
            </head>
            <body>
              ${pageHTMLKey && String(pageHTML[pageHTMLKey]) != "" ? pageHTML[pageHTMLKey] : ""}${extraText && String(extraText) != "" ? extraText : ""}
            </body>
          </html>

          
          
          `
        }
        __name(setupCORSHeaders, "setupCORSHeaders");
        __name2(setupCORSHeaders, "setupCORSHeaders");
        let targetUrl;
        try {
          targetUrl = new URL(decodeURIComponent(decodeURIComponent(originUrl.search.substring(1))));
        } catch(Error) {
            if (originUrl.search.toLowerCase() != "?uri" && originUrl.search.toLowerCase()) {
            return new Response(`{error: "${Error.name}", message: "Unable to decode given text '${originUrl.search.substring(1)}' into a URL. Is this a real website, and did you include 'http://' or 'https://'?"}`, {
              status: 404,
              statusText: Error.statusText || "PageNotFound",
              headers: {}
            })
          }
        }
        // Users either in your blacklist or not in your whitelist get caught here
        const originHeader = event.request.headers.get("Origin");
        if (targetUrl && isListedInWhitelist(targetUrl.toString(), blacklistUrls) || !isListedInWhitelist(originHeader, whitelistOrigins)) {
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

        // Allowed users continue through here
        const connectingIp = event.request.headers.get("CF-Connecting-IP");
        let customHeaders = event.request.headers.get("x-cors-headers");
        if (customHeaders !== null) {
          try {
            customHeaders = JSON.parse(customHeaders);
          } catch (Error) {
            if (debug) { console.warn(`Given customHeaders ${customHeaders.toString()} (type ${typeof (customHeaders)}) failed JSON parsing with the following error:`, Error); }
          }
        }

        if (originUrl.search.startsWith("?") && originUrl.search.toLowerCase() != "?uri") {
          const filteredHeaders = {};
          for (const [key, value] of event.request.headers.entries()) {
            if (key.match("^origin") === null && key.match("eferer") === null && key.match("^cf-") === null && key.match("^x-forw") === null && key.match("^x-cors-headers") === null) {
              filteredHeaders[key] = value;
            }
          }
          if (customHeaders !== null) {
            Object.entries(customHeaders).forEach((entry) => filteredHeaders[entry[0]] = entry[1]);
          }
          
          let newRequest;
          if (customHeaders && customHeaders["x-cancel-redirect"]) {
            newRequest = new Request(event.request, { headers: filteredHeaders });
          } else {
            newRequest = new Request(event.request, { redirect: "follow", headers: filteredHeaders });
          }
          
          let response, responseBody;
          try {
            response = await fetch(originUrl.search.substring(1), newRequest);
            responseBody = isPreflightRequest ? null : await response.arrayBuffer();
            if (debug) { console.log({ targetUrl, response }); }
          } catch (Error) {
            // Makes the internal error the thing that gets returned instead of a real response
            responseBody = Error;
            response = new Response(Error.toString(), {
              status: 500,
              statusText: Error.name || "FetchError",
              headers: {}
            });
            if (debug) { console.warn({ targetUrl, response }); }
          }
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
          if (customHeaders && customHeaders["x-cancel-redirect"]) {
            responseHeaders.set("x-request-url", targetUrl);
            responseHeaders.set("x-final-url", response.url);
          }
          if (debug) { console.log({ targetUrl, responseHeaders }); }
          const responseInit = {
            headers: responseHeaders,
            status: isPreflightRequest ? 200 : response.status,
            statusText: isPreflightRequest ? "OK" : response.statusText
          };
          return new Response(responseBody, responseInit);
        } else if (originUrl.search.toLowerCase() == "?uri" || originUrl.pathname.toLowerCase() == "/usage"){
          // Displays usage HTML if the originalUrl is just the word "usage" or "uri"
          let responseHeaders = new Headers();
          responseHeaders = setupCORSHeaders(responseHeaders);
          responseHeaders.set("Content-Type", "text/html");

          return new Response (addHTML("usage"), 
          {
            status: 200,
            headers: responseHeaders
          })
        } else {
          let responseHeaders = new Headers();
          responseHeaders = setupCORSHeaders(responseHeaders);
          responseHeaders.set("Content-Type", "text/html");
          let country;
          let colo;
          let clientData = "";

          if (typeof event.request.cf !== "undefined") {
            country = event.request.cf.country;
            colo = event.request.cf.colo;
          }
          const extraText = { // Key = pre ':' text, Array Val 1 = text, Array Val 2 = truthy to print it or not
            Usage: [`<a href='${originUrl.origin}/?uri'>${originUrl.origin}/?uri</a>`, true],
            Origin:[originHeader, originHeader !== null],
            "x-cors-headers": [JSON.stringify(customHeaders), customHeaders],
            IP:[connectingIp, true],
            Country:[country, country],
            Database:[colo, colo]
          }
          for (const [name, valueList] of Object.entries(extraText)) {
            if (valueList[1]) {
              clientData += "</br>\n\n" + name + ":</br>\n" + valueList[0];
            }
          }
          return new Response(
            addHTML("homepage", clientData),
            {
              status: 200,
              headers: responseHeaders
            }
          );
        }
      })());
    });
  })();
})();
//# sourceMappingURL=index.js.map
