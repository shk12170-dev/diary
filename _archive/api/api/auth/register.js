import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: '아이디는 영문/숫자/밑줄 3~20자여야 합니다.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
  }

  try {
    // users 테이블의 email 컬럼을 로그인 아이디로 그대로 사용한다 (이메일 형식 강제하지 않음).
    const existing = await sql`SELECT id FROM users WHERE email = ${username};`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
    }

    // 비밀번호는 bcrypt로 단방향 해시(솔트 포함)하여 저장 — 평문/복호화 불가능
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${username}, ${hashedPassword})
      RETURNING id, email, created_at;
    `;

    return res.status(201).json({ message: '회원가입 완료!', id: rows[0].id, username: rows[0].email });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ error: '서버 오류로 회원가입에 실패했습니다.' });
  }
}
