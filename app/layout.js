// app/layout.js
export const metadata = {
  title: '내 다이어리',
  description: 'Supabase 연동 프로젝트',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}