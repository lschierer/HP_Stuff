function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Normalize the URI by removing trailing slash for lookup
  var lookupUri = uri.endsWith("/") ? uri.slice(0, -1) : uri;

  // Check if this is a dynamic route by looking it up in the KV store
  var routeMapping = null;
  try {
    routeMapping = JSON.parse(KV.get("route:" + lookupUri) || "null");
    if (!routeMapping) {
      routeMapping = JSON.parse(KV.get("route:" + uri) || "null");
    }
  } catch (e) {
    console.log("Error getting route from KV store: " + e.toString());
  }

  // If we found a mapping and it's a server-side rendered route
  if (routeMapping && routeMapping.isSSR) {
    // Change the origin to the API Gateway
    request.origin = {
      custom: {
        domainName: "REPLACE_WITH_API_GATEWAY_DOMAIN",
        path: "/prod",
        port: 443,
        protocol: "https",
        sslProtocols: ["TLSv1.2"],
        readTimeout: 30,
        keepaliveTimeout: 5,
        customHeaders: {},
      },
    };

    // Update the URI to point to the API path
    request.uri = routeMapping.apiPath;

    // Add headers for the Lambda function
    request.headers["x-original-uri"] = { value: uri };
    if (routeMapping.context) {
      request.headers["x-route-context"] = {
        value: JSON.stringify(routeMapping.context),
      };
    }
  }
  // For static routes or routes not found in the KV store
  else {
    // Handle directory paths by appending index.html
    if (uri.endsWith("/")) {
      request.uri += "index.html";
    }
    // Check if the URI doesn't have an extension, might be a directory without trailing slash
    else if (!uri.includes(".")) {
      // Try to see if this is a known static route
      var potentialDirMapping = null;
      try {
        potentialDirMapping = JSON.parse(
          KV.get("route:" + uri + "/") || "null"
        );
      } catch (e) {
        // Ignore errors here
      }

      // If it's a known route with a trailing slash, redirect to it
      if (potentialDirMapping && !potentialDirMapping.isSSR) {
        request.uri += "/index.html";
      }
    }
  }

  return request;
}
