This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, prepare the development server:

```bash
npx prisma generate
```

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the results.



## The project features so far

Below is a directory graph of the actual project structure under `src/`, followed by a breakdown of each route and its Server Actions:

```bash
src/
├─ app/
│  ├─ layout.tsx     # Root layout (header, footer, metadata)
│  ├─ page.tsx       # Landing page
│  ├─ (sign)/        # Routes for user authentication
│  │  ├─ signin
│  │  └─ signup
│  └─ dashboard      # Main dashboard - allows viewing and managing boards
│     └─ profile     # Page for managing user's profile
│
├─ server/
│  ├─ actions/       # React server actions for retrieving and managing data
│  │  ├─ sign.ts     # sign up, sign in and sign out
│  │  ├─ user.ts     # managing user's profile
│  │  └─ board.ts    # creating, retrieving, updating and deleting user's boards
│  ├─ auth.ts        # Session and cookie helpers
│  ├─ dal.ts         # Data access layer abstractions
│  ├─ db.ts          # Prisma client initialization
│  └─ utils.ts       # Miscellaneous server utilities
│
└─ types/
   └─ global.d.ts    # Global type declarations
```




## Learn More

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
