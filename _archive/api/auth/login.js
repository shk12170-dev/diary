import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const { rows } = await sql`SELECT * FROM users WHERE email = ${username};`;
    if (rows.length === 0) {
      // 아이디가 없는 경우와 비밀번호가 틀린 경우를 같은 문구로 응답 (계정 존재 여부 추측 방지)
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.email },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );

    return res.status(200).json({ message: '로그인 성공!', token, username: user.email });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ error: '서버 오류로 로그인에 실패했습니다.' });
  }
}
