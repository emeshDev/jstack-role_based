// src/server/routers/user-router.ts
import { db } from "@/db";
import { router } from "../__internals/router";
import { superAdminProcedure } from "../procedures";
import { HTTPException } from "hono/http-exception";
import { Role } from "@/types";
import { z } from "zod";

export const userRouter = router({
  // Get all users except SUPER_ADMIN
  getUsers: superAdminProcedure.query(async ({ c }) => {
    try {
      const users = await db.user.findMany({
        where: {
          role: {
            not: Role.SUPER_ADMIN,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log("Raw DB users:", JSON.stringify(users, null, 2));
      // Debug log

      const response = {
        success: true,
        users: users.map((user) => ({
          ...user,
          emailVerified: user.emailVerified?.toISOString() || null,
          createdAt: user.createdAt.toISOString(),
        })),
      };

      console.log("Response before json:", JSON.stringify(response, null, 2)); // Debug log

      return c.json(response);
    } catch (error) {
      throw new HTTPException(500, {
        message:
          error instanceof Error ? error.message : "Failed to fetch users",
      });
    }
  }),

  // Update user role (hanya bisa ke ADMIN atau USER)
  updateRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum([Role.ADMIN, Role.USER]),
      })
    )
    .mutation(async ({ c, input }) => {
      try {
        const user = await db.user.update({
          where: { id: input.userId },
          data: { role: input.role },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        return c.json({
          success: true,
          user,
        });
      } catch (error) {
        throw new HTTPException(500, {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update user role",
        });
      }
    }),
});
