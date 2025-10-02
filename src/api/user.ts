import type { UserInfo } from '@/components/type';
import { http } from '@/utils/request';

// 定义API请求和响应类型
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

// 用户注册API
export const registerUser = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await http.post<AuthResponse>('/users/register', userData);
    return response;
  } catch (error) {
    console.error('用户注册失败:', error);
    throw error;
  }
};

// 用户登录API
export const loginUser = async (credentials: LoginRequest) => {
  try {
    const response = await http.post('/users/login', credentials);
    console.log('登录API原始响应:', response);
    return response;
  } catch (error) {
    console.error('用户登录失败:', error);
    throw error;
  }
};

// 登录API别名（兼容性）
export const login = loginUser;

// 令牌刷新API
export const refreshToken = async (refreshTokenData: RefreshTokenRequest): Promise<AuthResponse> => {
  try {
    const response = await http.post<AuthResponse>('/users/refresh', refreshTokenData);
    return response;
  } catch (error) {
    console.error('令牌刷新失败:', error);
    throw error;
  }
};

// 用户登出API
export const logoutUser = async (): Promise<{ message: string }> => {
  try {
    const response = await http.post<{ message: string }>('/users/logout');
    return response;
  } catch (error) {
    console.error('用户登出失败:', error);
    throw error;
  }
};

// 获取用户信息API
export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const response = await http.get<UserInfo>('/users/profile');
    return response;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// 更新用户信息API
export const updateUserInfo = async (userData: Partial<UserInfo>): Promise<UserInfo> => {
  try {
    const response = await http.put<UserInfo>('/users/profile', userData);
    return response;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};