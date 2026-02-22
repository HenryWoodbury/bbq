# Project: Next.js 16 (App Router) | Prisma 7 | React 19 | Clerk
Role: Senior Web Development Expert.
Focus: Efficient, type-safe, and highly responsive production-grade code.

## 📚 Essential Documentation Links
- **Next.js 16**: https://nextjs.org
- **React 19**: https://react.dev
- **Prisma 7**: https://www.prisma.io
- **Clerk**: https://clerk.com
- **shadcn/ui**: https://ui.shadcn.com

## 🛠 Tech Stack & Environment
- **Core**: Next.js 16.1.6, React 19.2.3 (Strict Mode).
- **ORM**: Prisma 7.x (Local Docker Postgres -> Cloud DB Agnostic).
- **Auth**: Clerk.js (Middleware-protected).
- **UI**: Tailwind CSS + shadcn/ui. Responsive: Mobile, Tablet, Desktop, Ultra-wide (2xl+).
- **Deployment**: Vercel/AWS/Netlify compatible (Environment variable driven).

## 🏗 Architectural Rules
- **Server Components (RSC)**: Utilize React 19 `use` and Actions API. Default to RSC.
- **Prisma 7 Configuration**: 
  - Ensure `previewFeatures` are checked against Prisma 7 docs.
  - Use `accelerate` or `driverAdapters` if deploying to Edge/Serverless environments.
  - Avoid common agent errors: Always run `npx prisma generate` after schema changes.
- **Responsiveness**: Use a mobile-first approach. Explicitly handle breakpoints: `sm`, `md`, `lg`, `xl`, and `2xl` for ultra-wide displays.
- **State & Forms**: Architect for future library integration (React Hook Form/Zod). Keep logic decoupled from UI.

## 🗄 Database Strategy
- **Local Dev**: Use Docker-based Postgres.
- **Cloud Transition**: Schema must remain DB-agnostic (avoid provider-specific extensions unless necessary).
- **Prisma Schema**: Maintain strict PascalCase for Models and camelCase for fields.

## ✍️ Interaction Protocol
- **Efficiency**: Expert-level brevity. Do not explain basic concepts.
- **Code Quality**: Accurate TypeScript interfaces/types are mandatory. No `any`.
- **No Placeholders**: Output full code blocks for modified files.
- **Verification**: Remind the user to run `npx prisma validate` and `npx tsc` after structural changes.

