import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//allow us to have authentication when every server request is made by having the auth state in the request itself. Rather than manually processing cookies on each request
//we can do this as part of middleware on an edge before it ever hits our own servers

export default withClerkMiddleware(() => {
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: "/((?!_next/image|_next/static|favicon.ico).*)",
};
