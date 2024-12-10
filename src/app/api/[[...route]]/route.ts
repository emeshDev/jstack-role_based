import { httpHandler } from "@/server";

// if you want runs on edge, enable this
// export const runtime = "edge";
// export const runtime = "nodejs";

export { httpHandler as GET, httpHandler as POST };
