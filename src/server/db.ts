import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); //logging queries, disable later

export default prisma;