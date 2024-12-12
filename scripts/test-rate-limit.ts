// scripts/test-rate-limit.ts
import { client } from "../src/lib/client";

async function testRateLimit() {
  console.log("Starting rate limit test...");

  const requestCount = 150; // Lebih dari batas rate limit
  const successResponses: any[] = [];
  const failedResponses: any[] = [];

  console.log(`Attempting ${requestCount} concurrent requests...`);

  try {
    // Buat array promise untuk request concurrent
    const requests = Array.from({ length: requestCount }, async (_, index) => {
      try {
        const response = await client.test["rate-limit"].$get();
        successResponses.push({
          index,
          status: response.status,
          data: await response.json(),
        });
        console.log(`Request ${index} succeeded`);
      } catch (error: any) {
        failedResponses.push({
          index,
          status: error.status,
          message: error.message,
        });
        console.log(`Request ${index} failed`);
      }
    });

    // Jalankan semua request secara concurrent
    await Promise.all(requests);

    // Tampilkan ringkasan hasil
    console.log("\n--- Test Results ---");
    console.log(`Total Requests: ${requestCount}`);
    console.log(`Successful Requests: ${successResponses.length}`);
    console.log(`Failed Requests: ${failedResponses.length}`);

    console.log("\nSuccessful Responses:");
    successResponses.forEach((resp, i) => {
      console.log(`[${i}] Status: ${resp.status}, Data:`, resp.data);
    });

    console.log("\nFailed Responses:");
    failedResponses.forEach((resp, i) => {
      console.log(`[${i}] Status: ${resp.status}, Message: ${resp.message}`);
    });
  } catch (error) {
    console.error("Overall test failed:", error);
  }
}

testRateLimit();
