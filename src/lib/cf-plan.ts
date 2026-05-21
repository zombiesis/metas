import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export type CfPlan = 'free' | 'pro' | 'business' | 'enterprise';

/**
 * Get the Cloudflare plan for the current branch.
 * Determines which security features the app needs to handle itself
 * vs what CF handles at the edge.
 */
export async function getBranchCfPlan(): Promise<CfPlan> {
  const branchId = await getCurrentBranchId();
  if (!branchId) return (process.env.CF_PLAN as CfPlan) || 'free';
  const settings = await prisma.branchSettings.findUnique({ where: { branchId }, select: { cfPlan: true } }).catch(() => null);
  return (settings?.cfPlan as CfPlan) || 'free';
}

/**
 * Security features the APP must handle based on CF plan.
 * Enterprise = CF handles most, app is backup.
 * Free = app must handle everything itself.
 */
export function getSecurityConfig(plan: CfPlan) {
  return {
    // Rate limiting: CF Enterprise does this at edge, Free needs app to do it
    appRateLimiting: plan === 'free' || plan === 'pro',

    // Bot detection: CF Enterprise has ML bots, Free only has basic
    appBotBlocking: plan !== 'enterprise',

    // WAF: CF Enterprise has full OWASP, Free has nothing
    appWafRules: plan === 'free' || plan === 'pro',

    // CAPTCHA: Always use Turnstile (works on all plans), but stricter on Free
    captchaMode: plan === 'enterprise' ? 'managed' : 'always',

    // Geo-blocking: CF Enterprise can do this at edge, Free can't
    appGeoBlocking: plan !== 'enterprise' && plan !== 'business',

    // DDoS: CF handles on all plans, but Free has less capacity
    appDdosProtection: plan === 'free',

    // How strict to be with suspicious requests
    securityLevel: plan === 'enterprise' ? 'low' : plan === 'business' ? 'medium' : 'high',
  };
}
