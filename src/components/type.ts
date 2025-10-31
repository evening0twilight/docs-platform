export interface UserInfo {
  id: string | number;
  username: string;        // 用户名（登录用）
  displayName?: string;    // 显示名称（可选）
  name?: string;           // 兼容旧版本
  email: string;
  // 用户头像
  avatar?: string;
  // 权限
  power?: number;
  // 其他可选字段
  bio?: string;
  location?: string;
  organization?: string;
  phone?: string;
  position?: string;
  website?: string;
}
