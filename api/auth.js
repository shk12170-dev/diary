import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS 설정 (브라우저 접근 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const { action } = req.query; // ?action=signup 또는 ?action=login
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    // 1. 회원가입 처리
    if (action === 'signup') {
      // 비밀번호 암호화 (복호화 불가능하게 변환)
      const hashedPassword = await bcrypt.hash(password, 10);

      // DB에 사용자 정보 저장
      const { rows } = await sql`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${hashedPassword})
        RETURNING id, email, created_at;
      `;

      return res.status(201).json({ message: '회원가입 완료!', user: rows[0] });
    }

    // 2. 로그인 처리
    if (action === 'login') {
      // DB에서 해당 이메일의 사용자 찾기
      const { rows } = await sql`SELECT * FROM users WHERE email = ${email};`;
      if (rows.length === 0) {
        return res.status(400).json({ error: '가입되지 않은 이메일입니다.' });
      }

      const user = rows[0];

      // 비밀번호 맞는지 확인
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
      }

      // 로그인 성공 시 통행증(JWT 토큰) 발급
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '24h' }
      );

      return res.status(200).json({ message: '로그인 성공!', token });
    }

    return res.status(400).json({ error: '올바른 action(signup 또는 login)을 지정해주세요.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}