/**
 * URL互換性確保のためのリダイレクト設定
 * 古いURLから新しい構造へのリダイレクト
 */

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // /booking → / リダイレクト
  if (url.pathname === '/booking') {
    return await sendRedirect(event, '/', 301)
  }
  
  // 管理機能への明示的アクセス
  if (url.pathname === '/admin') {
    return await sendRedirect(event, '/dashboard', 301)
  }
  
  return null
})