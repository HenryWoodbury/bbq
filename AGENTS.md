# Project: Next.js 16 (App Router) | Prisma 7 | React 19 | Clerk
Role: Senior Web Development Expert.
Focus: Efficient, type-safe, production-grade code.
Rollout: Focus on working prototype using free-tier services. Design architecture for future stages but don't build in advance of need. Current stage: **Dev**
  1 **Dev**: Code for local development, docker, free-tier services
  2 **Alpha**: dev --> staging. Hosted, remote demoable, still free-tier
  3 **Beta**: dev --> staging --> production. Support scaling, demoable to beta testers, expanded multi-tenancy
  4 **RC**: dev --> staging --> production, fully scalable

## 📚 NextJS Instructions

<!-- BEGIN:nextjs-agent-rules -->
- This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- Use kebab-case for all .ts and .tsx file names.
<!-- END:nextjs-agent-rules -->


## 📚 Essential Documentation Links
- **Next.js 16**: node_modules/next/dist/docs/
- **React 19**: https://react.dev/reference/react
- **Prisma 7**: https://www.prisma.io/docs
- **Clerk**: https://clerk.com/docs/reference/nextjs/overview
- **shadcn.ui**: https://ui.shadcn.com/docs
- **Lucide Icons**: https://lucide.dev/icons/
- **Tanstack Table**: https://tanstack.com/table/latest

## 🛠 Tech Stack & Environment
- **Core**: Next.js 16.1.6, React 19.2.3 (Strict Mode).
- **ORM**: Prisma 7.x (Local Docker Postgres -> Cloud DB Agnostic).
- **Auth**: Clerk.js (Middleware-protected).
- **UI**: 
  - Tailwind CSS + shadcn. 
  - Lucide icons.
- **Deployment**: Vercel/AWS/Netlify compatible (Environment variable driven).

## 🏗 Architectural Rules
- **Server Components (RSC)**: Utilize React 19 `use` and Actions API. Default to RSC.
- **Prisma 7 Configuration**: 
  - Ensure `previewFeatures` are checked against Prisma 7 docs.
  - Use `accelerate` or `driverAdapters` if deploying to Edge/Serverless environments.
  - Avoid common agent errors: Always run `npx prisma generate` after schema changes.
- **NextJS Configuration**:
  - Use the NextJS proxy configuration: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

## 📐 User Interface Concepts
- **Responsiveness**: Use a desktop-first approach with responsive layout. 
- **Accessibility**:
  - Utilize built-in accessibility features for all libraries
  - Ensure components are keyboard accessible

## 🗄 Database Strategy
- **Local Dev**: Use Docker-based Postgres.
- **Cloud Transition**: Schema must remain provider-agnostic (avoid provider-specific extensions).
- **Prisma Schema**: Maintain strict PascalCase for Models and camelCase for fields.

## ✍️ Interaction Protocol
- **Efficiency**: Expert-level brevity. Do not explain basic concepts.
- **Code Quality**: Accurate TypeScript interfaces/types are mandatory. No `any`.
- **No Placeholders**: Output full code blocks for modified files.
- **Verification**: Remind the user to run `npx prisma validate` and `npx tsc` after structural changes.
- **Plan Mode**: Do not implement from plan mode without verification.
