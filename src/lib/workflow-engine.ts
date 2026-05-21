import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';
import { renderTemplate, getTemplateVars, wrapInLayout } from '@/lib/email-templates';
import { logger } from '@/lib/logger';

export type WorkflowTrigger = 'form_submitted' | 'admission_created' | 'lead_status_changed' | 'content_published' | 'manual';
export type ActionType = 'send_email' | 'send_sms' | 'send_whatsapp' | 'update_status' | 'assign_to' | 'wait' | 'webhook';

export type WorkflowAction = {
  type: ActionType;
  config: Record<string, string>;
};

export type WorkflowCondition = {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';
  value: string;
};

/** Execute all workflows matching a trigger */
export async function executeWorkflows(trigger: WorkflowTrigger, data: Record<string, any>, branchId?: string | null) {
  const workflows = await prisma.workflow.findMany({
    where: { trigger, enabled: true, ...(branchId ? { branchId } : {}) },
  });

  for (const wf of workflows) {
    try {
      const conditions: WorkflowCondition[] = JSON.parse(wf.conditions);
      const actions: WorkflowAction[] = JSON.parse(wf.actions);

      // Check conditions
      if (!evaluateConditions(conditions, data)) continue;

      // Execute actions sequentially
      for (const action of actions) {
        await executeAction(action, data);
      }

      // Update run count
      await prisma.workflow.update({ where: { id: wf.id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
    } catch (err) {
      logger.error({ err, workflowId: wf.id }, 'Workflow execution failed');
    }
  }
}

function evaluateConditions(conditions: WorkflowCondition[], data: Record<string, any>): boolean {
  for (const c of conditions) {
    const value = String(data[c.field] || '');
    switch (c.operator) {
      case 'equals': if (value !== c.value) return false; break;
      case 'not_equals': if (value === c.value) return false; break;
      case 'contains': if (!value.includes(c.value)) return false; break;
      case 'gt': if (Number(value) <= Number(c.value)) return false; break;
      case 'lt': if (Number(value) >= Number(c.value)) return false; break;
    }
  }
  return true;
}

async function executeAction(action: WorkflowAction, data: Record<string, any>) {
  const { type, config } = action;
  const vars = await getTemplateVars({ ...data, name: data.studentName || data.name || '', email: data.email || '', phone: data.phone || '' });

  switch (type) {
    case 'send_email': {
      const to = renderTemplate(config.to || '{{email}}', vars);
      const subject = renderTemplate(config.subject || 'Notification', vars);
      const body = renderTemplate(config.body || '<p>Hello {{name}}</p>', vars);
      if (to) await sendEmail({ to, subject, html: wrapInLayout(body) });
      break;
    }
    case 'send_sms': {
      const to = renderTemplate(config.to || '{{phone}}', vars);
      const message = renderTemplate(config.message || 'Hello {{name}}', vars);
      if (to) await sendSms(to, message);
      break;
    }
    case 'send_whatsapp': {
      const to = renderTemplate(config.to || '{{phone}}', vars);
      if (to) await sendWhatsAppTemplate(to, config.template || 'admission_confirmation', [vars.name, vars.program || '']);
      break;
    }
    case 'update_status': {
      if (data.id && config.model) {
        await (prisma as any)[config.model]?.update({ where: { id: data.id }, data: { status: config.status } }).catch(() => null);
      }
      break;
    }
    case 'assign_to': {
      if (data.id && config.model) {
        await (prisma as any)[config.model]?.update({ where: { id: data.id }, data: { assignedTo: config.assignee } }).catch(() => null);
      }
      break;
    }
    case 'webhook': {
      if (config.url) {
        await fetch(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(5000) }).catch(() => null);
      }
      break;
    }
  }
}
