import type { UserInfo } from '@/components/type';
import { http } from '@/utils/request';

// 定义API请求和响应类型
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  code: string; // 验证码
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

// 发送邮箱验证码请求类型
interface SendVerificationCodeRequest {
  email: string;
  type: 'register' | 'reset_password' | 'change_email';
}

// 发送邮箱验证码响应类型
interface SendVerificationCodeResponse {
  code: number;
  message: string;
  data: {
    message: string;
  };
  timestamp: string;
}

// 重置密码请求类型
interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// 重置密码响应类型
interface ResetPasswordResponse {
  statusCode: number;
  message: string;
  data: {
    message: string;
  };
  timestamp: string;
}

// 发送邮箱验证码API
export const sendVerificationCode = async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
  try {
    const response = await http.post<SendVerificationCodeResponse>('/users/send-verification-code', data);
    return response;
  } catch (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }
};

// 重置密码API
export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  try {
    const response = await http.post<ResetPasswordResponse>('/users/reset-password', data);
    return response;
  } catch (error) {
    console.error('修改密码失败:', error);
    throw error;
  }
};

// 上传头像API响应类型（响应拦截器会提取 data.data）
interface UploadAvatarResponse {
  avatar: string;  // 响应拦截器返回的是 data.data 的内容
}

// 上传头像API
export const uploadAvatar = async (file: File): Promise<UploadAvatarResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 请求拦截器会自动处理 FormData，删除 Content-Type 让浏览器自动设置
    const response = await http.post<UploadAvatarResponse>('/users/avatar', formData);
    return response;
  } catch (error) {
    console.error('上传头像失败:', error);
    throw error;
  }
};

// 验证当前邮箱验证码请求类型
interface VerifyOldEmailRequest {
  email: string;  // 当前邮箱（用于校验是否一致）
  code: string;   // 当前邮箱验证码
}

// 验证当前邮箱验证码响应类型
interface VerifyOldEmailResponse {
  code: number;
  message: string;
  data: {
    verified: boolean;
  };
  timestamp: string;
}

// 验证当前邮箱验证码API
export const verifyOldEmail = async (data: VerifyOldEmailRequest): Promise<VerifyOldEmailResponse> => {
  try {
    const response = await http.put<VerifyOldEmailResponse>('/users/email/verify-old', data);
    return response;
  } catch (error) {
    console.error('验证当前邮箱失败:', error);
    throw error;
  }
};

// 更换邮箱API请求类型
interface ChangeEmailRequest {
  newEmail: string;      // 新邮箱
  newEmailCode: string;  // 新邮箱验证码
}

// 更换邮箱API响应类型
interface ChangeEmailResponse {
  code: number;
  message: string;
  data: UserInfo;
  timestamp: string;
}

// 更换邮箱API
export const changeEmail = async (emailData: ChangeEmailRequest): Promise<ChangeEmailResponse> => {
  try {
    const response = await http.put<ChangeEmailResponse>('/users/email', emailData);
    return response;
  } catch (error) {
    console.error('更换邮箱失败:', error);
    throw error;
  }
};

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

// 更新用户信息API请求类型
interface UpdateUserInfoRequest {
  username?: string;
  email?: string;
  avatar?: string;  // 添加 avatar 字段
}

// 更新用户信息API
export const updateUserInfo = async (userData: UpdateUserInfoRequest): Promise<UserInfo> => {
  try {
    const response = await http.put<UserInfo>('/users/profile', userData);
    return response;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};

// 修改密码API请求类型
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 修改密码API响应类型
interface ChangePasswordResponse {
  message: string;
}

// 修改密码API
export const changePassword = async (passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    const response = await http.put<ChangePasswordResponse>('/users/password', passwordData);
    return response;
  } catch (error) {
    console.error('修改密码失败:', error);
    throw error;
  }
};