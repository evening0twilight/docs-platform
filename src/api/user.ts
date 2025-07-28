import type { UserInfo } from '@/components/type';
import { getMockUserData, updateMockUserData } from '@/mock/user';

// 模拟API调用延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 获取用户信息API
export const getUserInfo = async (): Promise<UserInfo> => {
  // 模拟网络请求延迟
  await delay(500);
  return getMockUserData();
};

// 更新用户信息API
export const updateUserInfo = async (userData: Partial<UserInfo>): Promise<UserInfo> => {
  // 模拟网络请求延迟
  await delay(800);
  
  // 这里可以添加验证逻辑
  
  return updateMockUserData(userData);
};