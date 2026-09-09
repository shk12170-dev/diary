import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/requireAuth.js';

export default async function handler(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'DELETE 요청만 지원합니다.' });
  }

  try {
    // 자식 -> 부모 순서로 삭제 (FK 제약 위반 방지). 모두 user_id/토큰에서 나온 값으로만 필터링.
    await sql`DELETE FROM execution_records WHERE todo_id IN (SELECT id FROM todos WHERE user_id = ${userId});`;
    await sql`DELETE FROM todos WHERE user_id = ${userId};`;
    await sql`DELETE FROM plan_histories WHERE plan_id IN (SELECT id FROM plans WHERE user_id = ${userId});`;
    await sql`DELETE FROM plans WHERE user_id = ${userId};`;
    await sql`DELETE FROM users WHERE id = ${userId};`;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('account delete error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
