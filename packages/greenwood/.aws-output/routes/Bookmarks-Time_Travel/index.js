
    import { handler as $handler } from './Bookmarks-Time_Travel.route.js';
    export async function handler (event, context) {
      const { body, headers = {}, rawPath = '', rawQueryString = ''} = event;
      const { method = '' } = event?.requestContext?.http;
      const queryParams = rawQueryString === '' ? '' : `?${rawQueryString}`;
      const contentType = headers['content-type'] || '';
      let format = body;

      if (['GET', 'HEAD'].includes(method.toUpperCase())) {
        format = null
      } else if (contentType.includes('application/x-www-form-urlencoded') && event.isBase64Encoded) {
        const formData = new FormData();
        const formParams = new URLSearchParams(atob(body));

        formParams.forEach((value, key) => {
          formData.append(key, value);
        });

        // when using FormData, let Request set the correct headers
        // or else it will come out as multipart/form-data
        // https://stackoverflow.com/a/43521052/417806
        format = formData;
        delete headers['content-type'];
      } else if(contentType.includes('application/json')) {
        format = JSON.stringify(body);
      }

      const req = new Request(new URL(`${rawPath}${queryParams}`, `http://${headers.host}`), {
        body: format,
        headers: new Headers(headers),
        method
      });

      const res = await $handler(req);

      return {
        "body": await res.text(),
        "statusCode": res.status,
        "headers": Object.fromEntries(res.headers)
      }
    }
  