exports.handler = async (event, context) => {
  console.log("Event received:", JSON.stringify(event));

  try {
    // Extract the path from the event
    const requestPath = event.path;

    // Get the original URI from the headers if available
    const originalUri = event.headers["x-original-uri"] || requestPath;

    // Get any route context from the headers
    let routeContext = {};
    try {
      if (event.headers["x-route-context"]) {
        routeContext = JSON.parse(event.headers["x-route-context"]);
      }
    } catch (e) {
      console.error("Error parsing route context:", e);
    }

    // Check if this is a static file request (has extension or ends with index.html)
    if (originalUri.includes(".") || originalUri.endsWith("index.html")) {
      // Proxy to S3
      const s3Key = originalUri.startsWith("/")
        ? originalUri.substring(1)
        : originalUri;

      // Use AWS SDK to get the file from S3
      const AWS = require("aws-sdk");
      const s3 = new AWS.S3();

      try {
        const s3Response = await s3
          .getObject({
            Bucket: process.env.STATIC_BUCKET_NAME,
            Key: s3Key,
          })
          .promise();

        // Determine content type
        let contentType = "text/plain";
        if (s3Key.endsWith(".html")) contentType = "text/html";
        else if (s3Key.endsWith(".css")) contentType = "text/css";
        else if (s3Key.endsWith(".js")) contentType = "application/javascript";
        else if (s3Key.endsWith(".json")) contentType = "application/json";
        else if (s3Key.endsWith(".png")) contentType = "image/png";
        else if (s3Key.endsWith(".jpg") || s3Key.endsWith(".jpeg"))
          contentType = "image/jpeg";

        return {
          statusCode: 200,
          headers: {
            "Content-Type": contentType,
          },
          body: s3Response.Body.toString("base64"),
          isBase64Encoded: true,
        };
      } catch (error) {
        if (error.code === "NoSuchKey") {
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "text/html",
            },
            body: "<html><body><h1>404 Not Found</h1><p>The requested file could not be found.</p></body></html>",
          };
        }
        throw error;
      }
    }

    // For dynamic routes, continue with the existing logic
    // Extract the route name from the path or context
    const routeName = routeContext.id || requestPath.split("/").pop();

    if (!routeName) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "text/html",
        },
        body: "<html><body><h1>404 Not Found</h1><p>The requested route could not be found.</p></body></html>",
      };
    }

    // Determine the handler path
    const handlerPath = path.join(__dirname, "routes", routeName);

    // Check if we've already loaded this handler
    let handler;
    if (handlerCache.has(routeName)) {
      handler = handlerCache.get(routeName);
    } else {
      // Check if the handler exists
      if (!fs.existsSync(`${handlerPath}.js`)) {
        console.error(`Handler not found for route: ${routeName}`);
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "text/html",
          },
          body: "<html><body><h1>404 Not Found</h1><p>The requested route handler could not be found.</p></body></html>",
        };
      }

      // Load the handler
      handler = require(`./routes/${routeName}`);
      handlerCache.set(routeName, handler);
    }

    // Prepare the event for the handler
    const handlerEvent = {
      ...event,
      originalUri,
      routeContext,
    };

    // Call the handler
    return await handler.handler(handlerEvent, context);
  } catch (error) {
    console.error("Error processing request:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html",
      },
      body: "<html><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>",
    };
  }
};
