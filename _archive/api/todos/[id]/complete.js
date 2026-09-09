import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../../lib/requireAuth.js';

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const { id } = req.query;
  const { actualHours, obstacleReason } = req.body || {};

  try {
    const { rows: owned } = await sql`SELECT * FROM todos WHERE id = ${id} AND user_id = ${userId};`;
    if (owned.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    await sql`UPDATE todos SET status = 'DONE' WHERE id = ${id} AND user_id = ${userId};`;

    // execution_records.todo_id는 UNIQUE이므로, 이미 완료 기록이 있으면 덮어쓴다(재완료 처리 대비).
    const idempotencyKey = randomUUID();
    const { rows } = await sql`
      INSERT INTO execution_records (todo_id, idempotency_key, actual_hours, obstacle_reason)
      VALUES (${id}, ${idempotencyKey}, ${actualHours || 0}, ${obstacleReason || null})
      ON CONFLICT (todo_id) DO UPDATE
        SET actual_hours = EXCLUDED.actual_hours,
            obstacle_reason = EXCLUDED.obstacle_reason,
            completed_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    return res.status(200).json({
      todo: { id: owned[0].id, status: 'DONE' },
      record: {
        id: rows[0].id,
        todoId: rows[0].todo_id,
        actualHours: Number(rows[0].actual_hours),
        obstacleReason: rows[0].obstacle_reason,
        completedAt: rows[0].completed_at
      }
    });
  } catch (error) {
    console.error('complete error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
