export const handler = async (event, context, callback) => {
  const { request } = event.Records[0].cf;

  // re-write "clean" URLs to have index.html appended
  // to support routing for CloudFront <> S3
  if (request.uri.endsWith("/")) {
    request.uri = `${request.uri}index.html`;
  }

  callback(null, request);
};
