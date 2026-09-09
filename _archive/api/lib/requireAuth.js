import jwt from 'jsonwebtoken';

// 모든 보호된 API가 공통으로 쓰는 인증 검사기.
// 헤더에 유효한 Bearer 토큰이 없으면 401을 응답하고 null을 반환한다.
// 호출부는 `const userId = requireAuth(req, res); if (!userId) return;` 형태로 사용한다.
export function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '로그인이 필요합니다 (토큰 없음).' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    return decoded.userId;
  } catch (err) {
    res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
    return null;
  }
}
