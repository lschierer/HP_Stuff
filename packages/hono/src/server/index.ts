import { handle, type LambdaEvent, type LambdaContext } from "hono/aws-lambda";
import { app } from "./server"; // your Hono app

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  console.log("Lambda cold start");
  console.log("Incoming event:", JSON.stringify(event, null, 2));
  try {
    return await handle(app)(event, context);
  } catch (err) {
    console.error("Unhandled error:", err);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
