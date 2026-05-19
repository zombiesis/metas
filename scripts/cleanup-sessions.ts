/**
 * Cleanup expired sessions and old security events.
 * Run via: npx tsx scripts/cleanup-sessions.ts
 * Schedule as a cron job in production (e.g., daily).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // Delete expired sessions
  const expiredSessions = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  console.log(`Deleted ${expiredSessions.count} expired sessions.`);

  // Delete security events older than 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const oldEvents = await prisma.securityEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  console.log(`Deleted ${oldEvents.count} security events older than 90 days.`);

  // Unlock accounts whose lock has expired
  const unlocked = await prisma.user.updateMany({ where: { lockedUntil: { lt: now } }, data: { lockedUntil: null, failedLogins: 0 } });
  if (unlocked.count > 0) console.log(`Unlocked ${unlocked.count} accounts with expired locks.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
