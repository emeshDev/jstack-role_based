# JSTACK - Full Stack Template

A robust full-stack template based on [Josh](https://github.com/joschan21/)'s work, modified and enhanced with custom authentication ,session management and Redux -RTK Query 's integrated by [Afdhali](https://github.com/afdhali).

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **API Layer**: [Hono](https://hono.dev/)
- **Database**: PostgreSQL (on-premise) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **State Management & Data Fetching**: Redux Toolkit + RTK Query
- **Persistence**: Redux Persist
- **Type Safety**: TypeScript + Zod
- **Styling**: Tailwind CSS
- **Data Serialization**: SuperJSON

## ✨ Features

- 🔐 **Custom Auth & Session Management**

  - Secure cookie-based authentication
  - Session tracking with device management
  - Auto token refresh
  - Persistent sessions with database backup

- 🛠️ **Developer Experience**

  - Type-safe API routes with Hono
  - Prisma for database management
  - RTK Query for API calls
  - Zod validation
  - Full TypeScript support

- 📦 **Pre-configured Setup**
  - Redux store with persistence
  - RTK Query integration
  - Protected routes
  - Error handling
  - Typescript configurations
  - ESLint setup

## 🚦 Getting Started

1. **Clone & Install**

   ```bash
   git clone <repository-url>
   cd your-project-name
   npm install
   ```

2. **Environment Setup**

   - Copy `.env.sample` to `.env`

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_postgresql_url
   REDIS_URL=your_redis_url
   REDIS_TOKEN=your_redis_token
   ```

3. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── app/                  # Next.js app directory
├── components/          # React components
├── server/             # Hono API routes
│   ├── __internals/   # Internal API utilities
│   └── routers/       # API route handlers
├── lib/               # Utility functions
├── hooks/             # Custom React hooks
├── store/             # Redux store setup
│   ├── api.ts        # RTK Query API definitions
│   └── store.ts      # Redux store configuration
└── types/             # TypeScript types
```

## 🔄 Data Fetching with RTK Query

The template comes with pre-configured RTK Query integration in `/store/api.ts`. You can easily add your data fetching logic:

```typescript
// src/store/api.ts
export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args: unknown) => {
    try {
      const result = await args;
      return { data: result };
    } catch (error) {
      return { error };
    }
  },
  endpoints: (builder) => ({
    // Add your endpoints here
    getUsers: builder.query<User[], void>({
      query: () => client.users.getUsers.$get(),
    }),
    createUser: builder.mutation<User, CreateUserInput>({
      query: (input) => client.users.createUser.$post(input),
    }),
  }),
});

// Export hooks for usage in components
export const { useGetUsersQuery, useCreateUserMutation } = api;
```

Benefits:

- Automatic caching
- Loading & error states
- Optimistic updates
- TypeScript support
- Automatic re-fetching
- Cache invalidation

## 🔌 Creating Type-Safe Endpoints

The template provides a streamlined way to create type-safe API endpoints. Here's how:

### 1. Create Router/Controller (in `/server/routers/`)

```typescript
// /server/routers/users-router.ts
import { router } from "../__internals/router";
import { z } from "zod";
import { privateProcedure, publicProcedure } from "../procedures";

export const usersRouter = router({
  // Public endpoint example
  getUsers: publicProcedure.query(async ({ c }) => {
    const users = await db.user.findMany();
    return c.json({ users });
  }),

  // Protected endpoint with input validation
  createUser: privateProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ c, input, ctx }) => {
      const user = await db.user.create({
        data: input,
      });
      return c.json({ user });
    }),
});
```

### 2. Register Router in Main App (in `/server/index.ts`)

```typescript
import { Hono } from "hono";
import { usersRouter } from "./routers/users-router";

const app = new Hono().basePath("/api");

/**
 * Register your routers here
 */
const appRouter = app.route("/users", usersRouter); // This makes endpoints available at /api/users/*
// Add more routers here

export type AppType = typeof appRouter;
```

### 3. Define API Endpoints with RTK Query (in `/store/api.ts`)

```typescript
export const api = createApi({
  reducerPath: "api",
  baseQuery: /* ... */,
  endpoints: (builder) => ({
    // The endpoint name pattern follows:
    // client.<main_endpoint>.<controller_name>.<$get or $post>
    getUsers: builder.query<User[], void>({
      query: () => client.users.getUsers.$get(),
    }),
    createUser: builder.mutation<User, CreateUserInput>({
      query: (input) => client.users.createUser.$post(input),
    }),
  }),
});
```

### 4. Use in Components

```typescript
function UsersList() {
  // Type-safe hooks are automatically generated
  const { data: users, isLoading } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();

  return (
    // Your component JSX
  );
}
```

### Benefits of This Approach

- 🔒 **Complete Type Safety**: From API definition to client usage
- 💡 **IntelliSense Support**: Get autocomplete for endpoints and their parameters
- 🛡️ **Runtime Validation**: Using Zod for input validation
- 🔄 **Automatic Type Generation**: RTK Query generates typed hooks
- 📝 **Documentation**: Types serve as documentation
- 🐛 **Error Prevention**: Catch errors at compile time

## 🔑 Authentication Flow

The template uses a custom authentication system built on top of Supabase Auth:

- Cookie-based token storage
- Database session tracking
- Device management
- Auto token refresh
- Session timeout handling

## 🌐 Deployment

You can easily deploy with this template on & with :

- On Premise (such as VPS) by Docker
- On [Vercel](https://vercel.com), with [Neon](https://neon.tech)'s Postgres Database
- On [Cloudflare Worker's](https://workers.cloudflare.com/) as Edge Severless, with [Neon](https://neon.tech)'s Postgres Database & [wrangler](https://developers.cloudflare.com/workers/wrangler/)

## 🛟 Support

For issues and feature requests:

- Original template by: [Josh's GitHub](https://github.com/joschan21/)
- Auth modifications & Redux - RTK Query integrated by: [Afdhali's GitHub](https://github.com/afdhali)

## 📜 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Hono, and RTK Query
