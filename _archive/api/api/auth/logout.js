export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }
  // JWT는 상태를 서버에 저장하지 않는(stateless) 방식이라 서버가 개별 토큰을 강제로
  // 무효화할 수 없다. 실제 로그아웃 처리는 클라이언트가 localStorage의 토큰을 지우는 것으로 수행된다.
  // (⑥ 항목에 "로그아웃해도 탈취된 토큰 자체는 만료 전까지 계속 유효함"을 한계로 명시할 것)
  return res.status(200).json({ message: '로그아웃되었습니다.' });
}
