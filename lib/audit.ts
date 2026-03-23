import { prisma } from '@/lib/prisma'

export async function logAction(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  detail?: string
) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, detail },
  })
}
