import { NextApiRequest, NextApiResponse } from "next";
import { nextAuthOptions } from "@/utils/auth/nextAuthOption";
import { prisma } from "@/utils/prisma";
import AdmZip from "adm-zip";
import { Request, Response } from "express";
import { getServerSession } from "next-auth";

const zip = new AdmZip();

async function handler(req: NextApiRequest & Request, res: NextApiResponse & Response) {
  const { method } = req;

  switch (method) {
    case "POST":
      const ids = req.body?.id || [];

      const session = await getServerSession(req, res, nextAuthOptions);
      if (!session?.user?.id) return;

      const results = await prisma.statement.findMany({
        select: {
          file: true,
          name: true,
        },
        where: {
          id: {
            in: ids,
          },
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      if (ids.length === 1) {
        const pdfBuffer = results[0].file;
        res.setHeader("Content-disposition", `attachment; filename=${results[0].name}`);
        res.send(pdfBuffer);
      } else {
        results.forEach((result) => {
          zip.addFile(result.name, result.file);
        });
        res.setHeader("Content-disposition", `attachment; filename=statements.zip`);
        res.send(zip.toBuffer());
      }

      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;
