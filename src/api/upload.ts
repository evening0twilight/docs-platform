import http from '@/utils/request';

// 定义上传返回的图片信息类型
interface UploadImageResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * 上传单张图片
 * @param file 图片文件
 * @returns 图片URL和详细信息
 */
export const uploadImage = async (file: File): Promise<UploadImageResult> => {
  const formData = new FormData();
  formData.append('file', file);

  console.log('[上传图片]', file.name, file.size, file.type);

  const response = await http.post<{
    data: {
      url: string;
      filename: string;
      size: number;
      mimetype: string;
    };
    message: string;
  }>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('[上传响应]', response);
  
  return response as any;
};

/**
 * 批量上传图片(这个暂时没想到用，先一个一个传吧)
 * @param files 图片文件数组
 * @returns 图片URL数组
 */
export const uploadImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await http.post<{
    urls: string[];
    count: number;
  }>('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // 响应拦截器已解包,response 即 { urls, count };此前读 response.data.count 会抛 TypeError
  return response;
};
