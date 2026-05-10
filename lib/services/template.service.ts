import { db } from "@/lib/db";

export async function getTemplatesByUser(userId: string) {
  return db.lineItemTemplate.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createTemplate(
  userId: string,
  data: { name: string; description: string; unitPrice: number }
) {
  return db.lineItemTemplate.create({ data: { ...data, userId } });
}

export async function deleteTemplate(templateId: string, userId: string) {
  return db.lineItemTemplate.deleteMany({ where: { id: templateId, userId } });
}
