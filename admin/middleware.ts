export { auth as middleware } from "./auth";

// Or like this if you need to do something here.
// export default auth((req) => {
//   console.log(req.auth) //  { session: { user: { ... } } }
// })

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|public/|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)",
  ],
};


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
