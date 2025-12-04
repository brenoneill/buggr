import "next-auth";

/**
 * Extends the default NextAuth session and JWT types to include the GitHub access token.
 */
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

