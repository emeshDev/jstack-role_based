import { db } from "../src/db";

async function testConnection() {
  try {
    // Test koneksi dengan simple query
    const result = await db.$queryRaw`SELECT NOW()`;
    console.log("Database connection test successful:", result);

    // Test table exists
    const tableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Post'
      );
    `;
    console.log("Post table exists:", tableExists);

    // Test count records
    const count = await db.$queryRaw`SELECT COUNT(*) FROM "Post"`;
    console.log("Number of posts:", count);
  } catch (error) {
    console.error("Database operation failed:", error);
  } finally {
    await db.$disconnect();
    console.log("Database disconnected");
  }
}

testConnection().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
