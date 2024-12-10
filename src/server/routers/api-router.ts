import { db } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure, publicProcedure } from "../procedures";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

export const apiRouter = router({
  getPosts: publicProcedure.query(async ({ c }) => {
    try {
      console.log("Fetching posts...");
      const posts = await db.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log("Posts fetched successfully:", posts.length);
      return c.superjson({ posts });
    } catch (err) {
      // Type casting error
      const error = err as Error;
      console.error("Detailed error in getPosts:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
      throw new HTTPException(500, {
        message: error.message || "Failed to fetch posts",
      });
    }
  }),

  createPost: privateProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ c, input, ctx }) => {
      try {
        console.log("Creating post with input:", input);
        const post = await db.post.create({
          data: {
            name: input.name,
          },
        });
        console.log("Request by user : ", ctx.user);
        console.log("Post created successfully:", post);
        return c.superjson({ post });
      } catch (err) {
        const error = err as Error;
        console.error("Detailed error in createPost:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        });
        throw new HTTPException(500, {
          message: error.message || "Failed to create post",
        });
      }
    }),

  updatePost: privateProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ c, input, ctx }) => {
      try {
        console.log("Updating post with input:", input);
        const post = await db.post.update({
          where: { id: input.id },
          data: { name: input.name },
        });
        console.log("Request by user : ", ctx.user);
        console.log("Post updated:", post);
        return c.superjson({ post });
      } catch (error) {
        console.error("Error in updatePost:", error);
        throw new HTTPException(500, {
          message:
            error instanceof Error ? error.message : "Failed to update post",
        });
      }
    }),

  deletePost: privateProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        console.log("Deleting post:", input.id);
        const post = await db.post.delete({
          where: { id: input.id },
        });
        console.log("Request by user : ", ctx.user);
        console.log("Post deleted:", post);
        return c.superjson({ success: true });
      } catch (error) {
        console.error("Error in deletePost:", error);
        throw new HTTPException(500, {
          message:
            error instanceof Error ? error.message : "Failed to delete post",
        });
      }
    }),
});
