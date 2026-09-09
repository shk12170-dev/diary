import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/requireAuth.js';

function planToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    start: row.period_start,
    end: row.period_end,
    priority: row.priority,
    hours: Number(row.estimated_hours),
    criteria: row.success_criteria
  };
}
function historyToClient(row) {
  return {
    modifiedAt: row.modified_at,
    title: row.title,
    start: row.period_start,
    end: row.period_end,
    priority: row.priority,
    hours: Number(row.estimated_hours),
    criteria: row.success_criteria
  };
}

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    // 이 사용자의 계획은 항상 최신 1건만 "현재 계획"으로 취급한다 (user_id로 항상 필터링).
    const { rows: planRows } = await sql`
      SELECT * FROM plans WHERE user_id = ${userId} ORDER BY id DESC LIMIT 1;
    `;
    const currentPlan = planRows[0] || null;

    if (req.method === 'GET') {
      let histories = [];
      if (currentPlan) {
        const { rows } = await sql`
          SELECT * FROM plan_histories WHERE plan_id = ${currentPlan.id} ORDER BY modified_at ASC;
        `;
        histories = rows.map(historyToClient);
      }
      return res.status(200).json({ plan: planToClient(currentPlan), histories });
    }

    if (req.method === 'POST') {
      const { title, start, end, priority, hours, criteria } = req.body || {};
      if (!title || !start || !end || !priority || hours === undefined || !criteria) {
        return res.status(400).json({ error: '계획의 모든 항목을 입력해주세요.' });
      }

      if (currentPlan) {
        // 고치기 전 값을 이력 테이블에 먼저 남긴다 (처음 계획부터 그대로 보존).
        await sql`
          INSERT INTO plan_histories (plan_id, title, period_start, period_end, priority, success_criteria, estimated_hours)
          VALUES (${currentPlan.id}, ${currentPlan.title}, ${currentPlan.period_start}, ${currentPlan.period_end}, ${currentPlan.priority}, ${currentPlan.success_criteria}, ${currentPlan.estimated_hours});
        `;
        const { rows } = await sql`
          UPDATE plans
          SET title = ${title}, period_start = ${start}, period_end = ${end},
              priority = ${priority}, success_criteria = ${criteria}, estimated_hours = ${hours}
          WHERE id = ${currentPlan.id} AND user_id = ${userId}
          RETURNING *;
        `;
        const { rows: histRows } = await sql`
          SELECT * FROM plan_histories WHERE plan_id = ${currentPlan.id} ORDER BY modified_at ASC;
        `;
        return res.status(200).json({ plan: planToClient(rows[0]), histories: histRows.map(historyToClient) });
      } else {
        const { rows } = await sql`
          INSERT INTO plans (user_id, title, period_start, period_end, priority, success_criteria, estimated_hours)
          VALUES (${userId}, ${title}, ${start}, ${end}, ${priority}, ${criteria}, ${hours})
          RETURNING *;
        `;
        return res.status(201).json({ plan: planToClient(rows[0]), histories: [] });
      }
    }

    return res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
  } catch (error) {
    console.error('plan error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
