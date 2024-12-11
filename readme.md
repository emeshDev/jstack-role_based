# JSTACK - Full Stack Template

A robust full-stack template based on [Josh](https://github.com/joschan21/)'s work, modified and enhanced with custom authentication and session management.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **API Layer**: [Hono](https://hono.dev/)
- **Database**: PostgreSQL (on-premise) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **State Management**: Redux Toolkit + Redux Persist
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
└── types/             # TypeScript types
```

## 🔑 Authentication Flow

The template uses a custom authentication system built on top of Supabase Auth:
- Cookie-based token storage
- Database session tracking
- Device management
- Auto token refresh
- Session timeout handling

## 🛟 Support

For issues and feature requests:
- Original template: [Josh's GitHub](https://github.com/joschan21/)
- Auth modifications: [Afdhali's GitHub](https://github.com/afdhali)

## 📜 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Hono, and Prisma
