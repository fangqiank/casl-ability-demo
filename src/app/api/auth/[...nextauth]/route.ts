import NextAuth from "next-auth";
import {authOptions} from "@/lib/auth";
import {initializeDb} from "@/lib/db";

// Initialize database on auth route load
initializeDb().catch(console.error);

const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};
