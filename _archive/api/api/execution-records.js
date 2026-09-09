import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/requireAuth.js';

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 지원합니다.' });
  }

  try {
    // todos.user_id로 조인하여 "내 할 일"에 달린 실행 기록만 가져온다 (다른 사용자 기록은 절대 섞이지 않음).
    const { rows } = await sql`
      SELECT er.* FROM execution_records er
      JOIN todos t ON er.todo_id = t.id
      WHERE t.user_id = ${userId}
      ORDER BY er.completed_at DESC;
    `;
    const mapped = rows.map(r => ({
      id: r.id,
      todoId: r.todo_id,
      actualHours: Number(r.actual_hours),
      obstacleReason: r.obstacle_reason,
      completedAt: r.completed_at
    }));
    return res.status(200).json(mapped);
  } catch (error) {
    console.error('execution-records error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
