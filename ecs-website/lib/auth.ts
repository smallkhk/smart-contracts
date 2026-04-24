import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email guilds.members.read" } },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, discordTag: true },
        });
        session.user.role = dbUser?.role ?? Role.PLAYER;
        session.user.discordTag = dbUser?.discordTag ?? null;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const discordProfile = profile as {
          id: string;
          username: string;
          discriminator: string;
        };
        await prisma.user
          .update({
            where: { id: user.id! },
            data: {
              discordId: discordProfile.id,
              discordTag:
                discordProfile.discriminator === "0"
                  ? discordProfile.username
                  : `${discordProfile.username}#${discordProfile.discriminator}`,
            },
          })
          .catch(() => null);
      }
      return true;
    },
  },
  pages: { signIn: "/login" },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      discordTag?: string | null;
    };
  }
}
