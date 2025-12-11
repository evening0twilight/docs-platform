/**
 * Yjs协同编辑配置
 * 
 * 环境变量配置:
 * VITE_YJS_WS_URL - Yjs WebSocket服务器地址
 */

export const yjsConfig = {
  // WebSocket服务器地址
  wsUrl: import.meta.env.VITE_YJS_WS_URL || 'ws://localhost:1234',
  
  // 连接超时时间(毫秒)
  connectTimeout: 5000,
  
  // 重连间隔(毫秒)
  reconnectInterval: 2000,
  
  // 最大重连次数
  maxReconnectAttempts: 5,
  
  // 是否启用Yjs协同(可通过环境变量控制)
  enabled: import.meta.env.VITE_USE_YJS === 'true',
}

/**
 * 用户颜色方案
 */
export const userColors = [
  '#FF6B6B', // 红色
  '#4ECDC4', // 青色  
  '#45B7D1', // 蓝色
  '#FFA07A', // 橙色
  '#98D8C8', // 绿色
  '#F7DC6F', // 黄色
  '#BB8FCE', // 紫色
  '#85C1E2', // 浅蓝
  '#F8B88B', // 浅橙
  '#A8E6CF', // 浅绿
]

/**
 * 根据用户ID生成颜色
 */
export function getUserColor(userId: number): string {
  return userColors[userId % userColors.length]
}
