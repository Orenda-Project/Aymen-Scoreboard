/**
 * One-off recovery import: loads an exported DEMO.html backup JSON into Postgres
 * under a given user's account. Skips any workspace whose name already exists
 * for that user with positions in it (safe to re-run).
 *
 * Usage: node scripts/import-backup.js <backup.json> <userEmail>
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const DEFAULT_STATUSES = ['New', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];
const VALID_TYPES = ['text', 'status', 'date', 'file', 'percentage', 'number', 'email', 'phone'];
const FIXED = { Name: 'text', Email: 'email', Phone: 'phone' };

const hex = (c, fallback) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : fallback);

async function main() {
  const [, , backupPath, userEmail] = process.argv;
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error(`User not found: ${userEmail}`);

  let stats = { workspaces: 0, positions: 0, columns: 0, statuses: 0, candidates: 0, values: 0 };

  for (const lw of backup.workspaces || []) {
    const existing = await prisma.workspace.findFirst({
      where: { name: lw.name, members: { some: { userId: user.id } } },
      include: { _count: { select: { positions: true } } },
    });
    if (existing && existing._count.positions > 0) {
      console.log(`SKIP workspace "${lw.name}" — already exists with data`);
      continue;
    }

    const ws = existing ?? await prisma.workspace.create({
      data: {
        name: String(lw.name || 'Recovered Workspace').slice(0, 100),
        description: lw.description ? String(lw.description).slice(0, 500) : null,
        icon: String(lw.icon || '📋').slice(0, 10),
        color: hex(lw.color, '#1890ff'),
        createdById: user.id,
        members: { create: { userId: user.id, role: 'owner' } },
      },
    });
    stats.workspaces++;

    let posIdx = 0;
    for (const lp of lw.positions || []) {
      const position = await prisma.position.create({
        data: {
          workspaceId: ws.id,
          name: String(lp.name || 'Untitled Position').slice(0, 150),
          description: lp.description ? String(lp.description).slice(0, 1000) : null,
          color: hex(lp.color, '#1890ff'),
          isActive: !!lp.isActive,
          isCollapsed: !!lp.collapsed,
          sortOrder: posIdx++,
          createdById: user.id,
        },
      });
      stats.positions++;

      // Column plan: backup's order, with the standard fixed columns guaranteed,
      // plus columns for any candidate-data keys that have no column entry.
      const plan = [];
      const seen = new Set();
      const push = (name, type, visible, fixed) => {
        if (!name || seen.has(name)) return;
        seen.add(name);
        plan.push({ name: String(name).slice(0, 100), type, visible, fixed });
      };

      for (const lc of lp.columns || []) {
        const isFixed = lc.name in FIXED;
        const type = isFixed ? FIXED[lc.name] : (lc.name === 'Status' ? 'status' : (VALID_TYPES.includes(lc.type) ? lc.type : 'text'));
        push(lc.name, type, lc.visible !== false, isFixed);
      }
      push('Name', 'text', true, true);
      push('Email', 'email', false, true);
      push('Phone', 'phone', false, true);
      push('Status', 'status', true, false);
      for (const cand of lp.candidates || []) {
        for (const key of Object.keys(cand.data || {})) push(key, 'text', true, false);
      }

      const colIdByName = {};
      for (let i = 0; i < plan.length; i++) {
        const col = await prisma.column.create({
          data: {
            positionId: position.id,
            name: plan[i].name,
            type: plan[i].type,
            isFixed: plan[i].fixed,
            isVisible: plan[i].visible,
            sortOrder: i,
          },
        });
        colIdByName[plan[i].name] = col.id;
        stats.columns++;
      }

      // Custom statuses: backup entries + any used Status value beyond the defaults
      const statusNames = new Set((lp.customStatuses || []).map(s => s?.name).filter(Boolean));
      for (const cand of lp.candidates || []) {
        const s = cand.data?.Status;
        if (typeof s === 'string' && s.trim() && !DEFAULT_STATUSES.includes(s.trim())) statusNames.add(s.trim());
      }
      let stIdx = 0;
      for (const sName of statusNames) {
        const fromBackup = (lp.customStatuses || []).find(s => s?.name === sName);
        await prisma.customStatus.create({
          data: {
            positionId: position.id,
            name: String(sName).slice(0, 100),
            colorClass: String(fromBackup?.colorClass || 'badge-blue'),
            sortOrder: stIdx++,
          },
        });
        stats.statuses++;
      }

      let candIdx = 0;
      for (const lc of lp.candidates || []) {
        const candidate = await prisma.candidate.create({
          data: { positionId: position.id, sortOrder: candIdx++, createdById: user.id },
        });
        stats.candidates++;

        const values = [];
        for (const [key, raw] of Object.entries(lc.data || {})) {
          let value;
          if (raw === null || raw === undefined || raw === '') continue;
          if (typeof raw === 'object') {
            if (raw.name) value = String(raw.name); // file cell → keep the filename as text
            else continue;
          } else {
            value = String(raw);
          }
          const columnId = colIdByName[key];
          if (columnId) values.push({ candidateId: candidate.id, columnId, value });
        }
        if (values.length) {
          await prisma.candidateValue.createMany({ data: values, skipDuplicates: true });
          stats.values += values.length;
        }
      }
      console.log(`  imported position "${lp.name}" (${(lp.candidates || []).length} candidates)`);
    }
    console.log(`imported workspace "${lw.name}"`);
  }

  console.log('DONE:', JSON.stringify(stats));
}

main()
  .catch(e => { console.error('IMPORT FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
