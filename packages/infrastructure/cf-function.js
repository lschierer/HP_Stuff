import cf from "cloudfront";

// This fails if there is no key value store associated with the function
const kvsHandle = cf.kvs();

// Remember to associate the KVS with your function before referencing KVS in your code.
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/kvs-with-functions-associate.html
export async function handler(event) {
  const request = event.request;

  const key = request.uri;
  try {
    const kvResult = await kvsHandle.get(key);
    const newUri = `/routes/${kvResult}`;
    console.log(`${request.uri} -> ${newUri}`);
    request.uri = newUri;
  } catch (err) {
    // No change to the pathname if the key is not found
    console.log(`${request.uri} | ${err}`);
  }
  return request;
}
