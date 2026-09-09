import { sql } from '@vercel/postgres';
import { requireAuth } from '../../lib/requireAuth.js';

function toClient(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    dueDate: row.due_date,
    priority: row.priority,
    tags: row.tags || '',
    estimatedHours: Number(row.estimated_hours)
  };
}

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    // GET: 로그인한 내 할 일만 (다른 사용자의 할 일은 user_id 조건 때문에 절대 섞이지 않음)
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM todos WHERE user_id = ${userId} ORDER BY id DESC;
      `;
      return res.status(200).json(rows.map(toClient));
    }

    // POST: 내 할 일로 추가 (user_id는 토큰에서 뽑은 값만 사용 — 요청 body의 값은 신뢰하지 않음)
    if (req.method === 'POST') {
      const { title, dueDate, priority, tags, estimatedHours } = req.body || {};
      if (!title || !dueDate || !priority || estimatedHours === undefined) {
        return res.status(400).json({ error: '할 일 내용, 마감일, 우선순위, 예상 시간을 모두 입력해주세요.' });
      }
      const { rows } = await sql`
        INSERT INTO todos (user_id, title, due_date, priority, tags, estimated_hours, status)
        VALUES (${userId}, ${title}, ${dueDate}, ${priority}, ${tags || ''}, ${estimatedHours}, 'TODO')
        RETURNING *;
      `;
      return res.status(201).json(toClient(rows[0]));
    }

    return res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
  } catch (error) {
    console.error('todos error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
