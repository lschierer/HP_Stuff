// Lambda@Edge handler for dynamic routes
exports.handler = async (event) => {
  console.log('Event: ', JSON.stringify(event));
  
  const request = event.Records[0].cf.request;
  const uri = request.uri;
  
  console.log('Request URI: ', uri);
  
  // Process the request based on the URI
  try {
    // This is where your dynamic content generation would happen
    // For now, we'll just return a simple response
    const response = {
      status: '200',
      statusDescription: 'OK',
      headers: {
        'cache-control': [{
          key: 'Cache-Control',
          value: 'max-age=0'
        }],
        'content-type': [{
          key: 'Content-Type',
          value: 'text/html'
        }]
      },
      body: `<!DOCTYPE html>
<html>
<head>
  <title>Dynamic Content</title>
</head>
<body>
  <h1>Dynamic Content</h1>
  <p>This content was generated dynamically by Lambda@Edge.</p>
  <p>Request URI: ${uri}</p>
</body>
</html>`
    };
    
    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      status: '500',
      statusDescription: 'Internal Server Error',
      headers: {
        'content-type': [{
          key: 'Content-Type',
          value: 'text/html'
        }]
      },
      body: `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
</head>
<body>
  <h1>Error</h1>
  <p>An error occurred processing your request.</p>
</body>
</html>`
    };
  }
};
