(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // index.js
  var blacklistUrls = [];
  var whitelistOrigins = [".*"];
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
  addEventListener("fetch", async (event) => {
    event.respondWith((async function() {
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
      __name(setupCORSHeaders, "setupCORSHeaders");
      const targetUrl = decodeURIComponent(decodeURIComponent(originUrl.search.substr(1)));
      const originHeader = event.request.headers.get("Origin");
      const connectingIp = event.request.headers.get("CF-Connecting-IP");
      if (!isListedInWhitelist(targetUrl, blacklistUrls) && isListedInWhitelist(originHeader, whitelistOrigins)) {
        let customHeaders = event.request.headers.get("x-cors-headers");
        if (customHeaders !== null) {
          try {
            customHeaders = JSON.parse(customHeaders);
          } catch (e) {
          }
        }
        if (originUrl.search.startsWith("?")) {
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
            newRequest = new Request(event.request, { headers: filteredHeaders })
          } else {
            newRequest = new Request(event.request, { redirect: "follow", headers: filteredHeaders })
          }
          const response = await fetch(originUrl.search.substr(1), newRequest);
          console.log({ targetUrl, response });
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
          console.log({ targetUrl, responseHeaders });
          const responseBody = isPreflightRequest ? null : await response.arrayBuffer();
          const responseInit = {
            headers: responseHeaders,
            status: isPreflightRequest ? 200 : response.status,
            statusText: isPreflightRequest ? "OK" : response.statusText
          };
          return new Response(responseBody, responseInit);
        } else {
          let responseHeaders = new Headers();
          responseHeaders = setupCORSHeaders(responseHeaders);
          let country = false;
          let colo = false;
          if (typeof event.request.cf !== "undefined") {
            country = event.request.cf.country || false;
            colo = event.request.cf.colo || false;
          }
          return new Response(
            "CLOUDFLARE-CORS-ANYWHERE\n\nSource:\nhttps://github.com/Zibri/cloudflare-cors-anywhere\n\nUsage:\n" + originUrl.origin + "/?uri\n\nDonate:\nhttps://paypal.me/Zibri/5\n\nLimits: 100,000 requests/day\n          1,000 requests/10 minutes\n\n" + (originHeader !== null ? "Origin: " + originHeader + "\n" : "") + "IP: " + connectingIp + "\n" + (country ? "Country: " + country + "\n" : "") + (colo ? "Datacenter: " + colo + "\n" : "") + "\n" + (customHeaders !== null ? "\nx-cors-headers: " + JSON.stringify(customHeaders) : ""),
            {
              status: 200,
              headers: responseHeaders
            }
          );
        }
      } else {
        return new Response(
          "Create your own CORS proxy</br>\n<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>\n\nDonate</br>\n<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a>\n",
          {
            status: 403,
            statusText: "Forbidden",
            headers: {
              "Content-Type": "text/html"
            }
          }
        );
      }
    })());
  });
})();
//# sourceMappingURL=index.js.map
