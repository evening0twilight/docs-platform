import type { UserInfo } from '@/components/type';

// 初始模拟数据
export const mockUserData: UserInfo = {
  id: '10001',
  username: '张三',
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp',
  power: 2
};

// 将数据存储到localStorage
export const initMockData = () => {
  if (!localStorage.getItem('mockUserData')) {
    localStorage.setItem('mockUserData', JSON.stringify(mockUserData));
  }
};

// 获取模拟数据
export const getMockUserData = (): UserInfo => {
  const data = localStorage.getItem('mockUserData');
  return data ? JSON.parse(data) : mockUserData;
};

// 更新模拟数据
export const updateMockUserData = (userData: Partial<UserInfo>): UserInfo => {
  const currentData = getMockUserData();
  const updatedData = { ...currentData, ...userData };
  localStorage.setItem('mockUserData', JSON.stringify(updatedData));
  return updatedData;
};