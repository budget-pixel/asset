import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "ADMIN" | "VIEWER";
    } & DefaultSession["user"];
  }
}
