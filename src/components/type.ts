export interface UserInfo {
  id: string;
  name: string;
  email: string;
  // 用户头像
  avatar?: string;
  // 权限
  power: number;
}
