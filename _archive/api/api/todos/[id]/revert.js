import { sql } from '@vercel/postgres';
import { requireAuth } from '../../../lib/requireAuth.js';

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const { id } = req.query;

  try {
    const { rows: owned } = await sql`SELECT * FROM todos WHERE id = ${id} AND user_id = ${userId};`;
    if (owned.length === 0) {
      return res.status(404).json({ error: '해당 할 일을 찾을 수 없습니다.' });
    }

    await sql`UPDATE todos SET status = 'TODO' WHERE id = ${id} AND user_id = ${userId};`;
    await sql`DELETE FROM execution_records WHERE todo_id = ${id};`;

    return res.status(200).json({ id, status: 'TODO' });
  } catch (error) {
    console.error('revert error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
