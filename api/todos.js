import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. 헤더에서 토큰(통행증) 가져오기
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다 (토큰 없음).' });
  }

  const token = authHeader.split(' ')[1];
  let userId;

  try {
    // 2. 토큰 검증해서 "누구의 데이터인지(userId)" 알아내기
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    userId = decoded.userId;
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }

  try {
    // GET: 내 할 일 목록만 가져오기
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM todos WHERE user_id = ${userId} ORDER BY id DESC;
      `;
      return res.status(200).json(rows);
    }

    // POST: 내 할 일 추가하기
    if (req.method === 'POST') {
      const { title, dueDate, priority, tags, estimatedHours } = req.body;
      const { rows } = await sql`
        INSERT INTO todos (user_id, title, due_date, priority, tags, estimated_hours, status)
        VALUES (${userId}, ${title}, ${dueDate}, ${priority}, ${tags}, ${estimatedHours}, 'TODO')
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}