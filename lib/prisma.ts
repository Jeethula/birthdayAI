import { PrismaClient } from "@prisma/client";

// Add prisma to the global type
declare global {
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;
// Check if we're in development
if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to keep the connection alive between hot reloads
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
} else {
  // In production, create a new instance
  prisma = new PrismaClient();
}

export default prisma;
