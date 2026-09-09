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

  const { id } = req.query;

  try {
    // 이 할 일이 실제로 "내 것"인지 먼저 확인한다.
    // 다른 사용자의 id를 넣어도 존재 여부를 알려주지 않기 위해 항상 404로만 응답한다(403 대신 404로 정보 은폐).
    const { rows: owned } = await sql`SELECT * FROM todos WHERE id = ${id} AND user_id = ${userId};`;
    if (owned.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    if (req.method === 'PUT') {
      const { title, dueDate, priority, tags, estimatedHours } = req.body || {};
      const { rows } = await sql`
        UPDATE todos
        SET title = ${title}, due_date = ${dueDate}, priority = ${priority},
            tags = ${tags || ''}, estimated_hours = ${estimatedHours}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *;
      `;
      return res.status(200).json(toClient(rows[0]));
    }

    if (req.method === 'DELETE') {
      // 실행 기록(execution_records)이 todo_id를 참조하므로 자식 레코드부터 지운다.
      await sql`DELETE FROM execution_records WHERE todo_id = ${id};`;
      await sql`DELETE FROM todos WHERE id = ${id} AND user_id = ${userId};`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
  } catch (error) {
    console.error('todos/[id] error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
