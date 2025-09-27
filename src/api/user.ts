import type { UserInfo } from '@/components/type';
import { http } from '@/utils/request';

// 获取用户信息API
export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const response = await http.get<UserInfo>('/user/profile');
    return response;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// 更新用户信息API
export const updateUserInfo = async (userData: Partial<UserInfo>): Promise<UserInfo> => {
  try {
    const response = await http.put<UserInfo>('/user/profile', userData);
    return response;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};