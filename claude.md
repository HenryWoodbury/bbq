# Project: Next.js 16 (App Router) | Prisma 7 | React 19 | Clerk
Role: Senior Web Development Expert.
Focus: Efficient, type-safe, and highly responsive production-grade code.
Rollout: Focus on working prototype using free-tier services. Design architecture for future stages but don't build in advance of need. Current stage: **Dev**
  1 **Dev**: Code for local development, docker, free-tier services
  2 **Alpha**: dev --> staging. Hosted, demoable to partners, limited tenants, still free-tier
  3 **Beta**: dev --> staging --> production. Support scaling, demoable to beta testers, expanded multi-tenancy
  4 **RC**: dev --> staging --> production, fully scalable

## 📚 Essential Documentation Links
- **Next.js 16**: https://nextjs.org
- **React 19**: https://react.dev
- **Prisma 7**: https://www.prisma.io
- **Clerk**: https://clerk.com
- **shadcn.ui**: https://ui.shadcn.com
- **Lucide Icons**: https://lucide.dev/icons/
- **Tanstack Form**: https://tanstack.com/form/latest/docs/overview
- **Tanstack Table**: https://tanstack.com/table/latest
- **Tanstack Query**: https://tanstack.com/query/latest/docs/framework/react/overview

## 🛠 Tech Stack & Environment
- **Core**: Next.js 16.1.6, React 19.2.3 (Strict Mode).
- **ORM**: Prisma 7.x (Local Docker Postgres -> Cloud DB Agnostic).
- **Auth**: Clerk.js (Middleware-protected).
- **UI**: 
  - Tailwind CSS + shadcn. 
  - Lucide icons.
  - Responsive: Mobile, Tablet, Desktop, Ultra-wide (2xl+).
  - Light and Dark mode.
- **Deployment**: Vercel/AWS/Netlify compatible (Environment variable driven).

## 🏗 Architectural Rules
- **Server Components (RSC)**: Utilize React 19 `use` and Actions API. Default to RSC.
- **Prisma 7 Configuration**: 
  - Ensure `previewFeatures` are checked against Prisma 7 docs.
  - Use `accelerate` or `driverAdapters` if deploying to Edge/Serverless environments.
  - Avoid common agent errors: Always run `npx prisma generate` after schema changes.
- **Responsiveness**: Use a desktop-first approach with responsive design. 
  - Goal is a whiteboard type implementation that allows access to tools and research in place. Design TBD.
  - Minimal scrolling
  - Handle breakpoints: `sm`, `md`, `lg`, `xl`, and `2xl` for ultra-wide displays. Do not lock into every breakpoint if responsive design will sufficiently work.
- **Mobile**: Complexity of draft details will require a unique mobile design using the `sm` breakpoint. Design TBD.
- **NextJS Configuration**:
  - https://nextjs.org/docs/app/api-reference/file-conventions/proxy

## 🗄 Database Strategy
- **Local Dev**: Use Docker-based Postgres.
- **Cloud Transition**: Schema must remain DB-agnostic (avoid provider-specific extensions unless necessary).
- **Prisma Schema**: Maintain strict PascalCase for Models and camelCase for fields.

## ✍️ Interaction Protocol
- **Efficiency**: Expert-level brevity. Do not explain basic concepts.
- **Code Quality**: Accurate TypeScript interfaces/types are mandatory. No `any`.
- **No Placeholders**: Output full code blocks for modified files.
- **Verification**: Remind the user to run `npx prisma validate` and `npx tsc` after structural changes.
- **Plan Mode**: Do not implement from plan mode without verification.
