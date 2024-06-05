import { NextRequest } from "next/server"
import authConfig from "./auth.config"
import NextAuth from "next-auth"

// Use only one of the two middleware options below
// 1. Use middleware directly
// export const { auth: middleware } = NextAuth(authConfig)

// 2. Wrapped middleware option
const { auth } = NextAuth(authConfig)
export default auth(async function middleware(req: NextRequest) {
  // const token = req.
  // if (!token) {
  //   return NextResponse.redirect("/api/auth/signin")
  // }
})

// import { withAuth } from "next-auth/middleware";
// import { NextRequest, NextResponse } from "next/server";

// const routesWithoutPermission = ["profile"];

// export default withAuth(
//   // `withAuth` augments your `Request` with the user's token.
//   function middleware(req) {
//     const token = req.nextauth.token;
//     if (!token) {
//       return NextResponse.redirect("/api/auth/signin");
//     }
//     const path = req.nextUrl.pathname.split("/");
//     // get last values from path
//     let entity = path[path.length - 1];
//     if (path[1] == "settings") {
//       entity = "settings";
//     }

//     if (path[1] == "reports") {
//       entity = "reports";
//     }

//     if (routesWithoutPermission.includes(entity)) {
//       return NextResponse.next();
//     }

//     if (entity.length > 0 && token.rights) {
//       const rights = token.rights as string[];
//       if (!rights.includes(`${entity}.list`)) {
//         return NextResponse.redirect(new URL("/forbidden", req.url));
//       }
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token, req }) => {
//         if (!token) return false;
//         if (!token.accessToken) return false;

//         return true;
//       },
//     },
//   }
// );
// export const config = {
//   // matcher: ["/profile"],
//   matcher: [
//     "/((?!register|api|static|login|.*\\..*|_next|forbidden|_next/static|_next/image|favicon.ico|robots.txt).*)",
//   ],
// };
