function handler(event) {
  var request = event.request;
  
  // re-write "clean" URLs to have index.html appended
  // to support routing for CloudFront
  if (request.uri.endsWith("/")) {
    request.uri = request.uri + "index.html";
  } else if (!request.uri.includes(".")) {
    // If the URI doesn't contain a file extension, assume it's a directory
    request.uri = request.uri + "/index.html";
  }
  
  return request;
}
