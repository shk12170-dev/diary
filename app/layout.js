import './globals.css'

export const metadata = {
  title: '플랜두씨 다이어리 — Plan-Do-See',
  description: '과제7: Supabase Auth로 로그인/인가를 붙인 Plan-Do-See 다이어리',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
