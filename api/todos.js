import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS 설정 (필요시)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. GET: 목록 조회
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM todos ORDER BY created_at DESC;`;
      return res.status(200).json(rows);
    }

    // 2. POST: 새 할 일 추가
    if (req.method === 'POST') {
      const { title, dueDate, priority, tags, estimatedHours } = req.body;
      const { rows } = await sql`
        INSERT INTO todos (title, due_date, priority, tags, estimated_hours, status)
        VALUES (${title}, ${dueDate}, ${priority}, ${tags}, ${estimatedHours}, 'TODO')
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}