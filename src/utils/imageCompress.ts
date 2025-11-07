/**
 * 图片压缩工具
 */

// 头像配置
export const AVATAR_CONFIG = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  recommendSize: 500, // 推荐尺寸 500x500
  noCompressThreshold: 500 * 1024, // 小于 500KB 不压缩
};

// 编辑器图片配置
export const EDITOR_IMAGE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  maxWidth: 1920, // 最大宽度
  maxHeight: 1080, // 最大高度
  quality: 0.9, // 压缩质量
  noCompressThreshold: 1 * 1024 * 1024, // 小于 1MB 不压缩
};

/**
 * 验证图片文件
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // 验证文件类型
  if (!AVATAR_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `只支持 ${AVATAR_CONFIG.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join('、')} 格式的图片`,
    };
  }

  // 验证文件大小
  if (file.size > AVATAR_CONFIG.maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${AVATAR_CONFIG.maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
};

/**
 * 压缩图片
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 压缩后的文件
 */
export const compressImage = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    toSquare?: boolean; // 是否裁剪为正方形
  } = {}
): Promise<File> => {
  const {
    maxWidth = AVATAR_CONFIG.recommendSize,
    maxHeight = AVATAR_CONFIG.recommendSize,
    quality = 0.8,
    toSquare = true,
  } = options;

  return new Promise((resolve, reject) => {
    // 如果文件小于阈值，直接返回原文件
    if (file.size < AVATAR_CONFIG.noCompressThreshold) {
      console.log('文件小于 500KB，跳过压缩');
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        try {
          // 创建 canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
          }

          let width = img.width;
          let height = img.height;
          let offsetX = 0;
          let offsetY = 0;

          // 如果需要裁剪为正方形
          if (toSquare) {
            const size = Math.min(width, height);
            offsetX = (width - size) / 2;
            offsetY = (height - size) / 2;
            width = size;
            height = size;
          }

          // 计算缩放比例
          let scale = 1;
          if (width > maxWidth || height > maxHeight) {
            scale = Math.min(maxWidth / width, maxHeight / height);
          }

          // 设置 canvas 尺寸
          canvas.width = width * scale;
          canvas.height = height * scale;

          // 绘制图片（如果是正方形，从中心裁剪；否则完整绘制）
          ctx.drawImage(
            img,
            offsetX, offsetY, width, height, // 源图片裁剪区域
            0, 0, canvas.width, canvas.height // 目标绘制区域
          );

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              // 生成文件名（保持原扩展名）
              const fileExtension = file.name.split('.').pop() || 'jpg';
              const fileName = `avatar_${Date.now()}.${fileExtension}`;

              // 创建新文件
              const compressedFile = new File([blob], fileName, {
                type: file.type,
                lastModified: Date.now(),
              });

              console.log(`压缩完成: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败，请选择有效的图片文件'));
      };
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
  });
};

/**
 * 处理头像上传（验证 + 压缩）
 */
export const processAvatarImage = async (file: File): Promise<File> => {
  // 1. 验证文件
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. 压缩图片
  try {
    const compressedFile = await compressImage(file, {
      maxWidth: AVATAR_CONFIG.recommendSize,
      maxHeight: AVATAR_CONFIG.recommendSize,
      quality: 0.8,
      toSquare: true, // 裁剪为正方形
    });

    return compressedFile;
  } catch (error) {
    console.error('图片压缩失败:', error);
    throw error;
  }
};

/**
 * 验证编辑器图片文件
 */
export const validateEditorImageFile = (file: File): { valid: boolean; error?: string } => {
  // 验证文件类型
  if (!EDITOR_IMAGE_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `只支持 ${EDITOR_IMAGE_CONFIG.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join('、')} 格式的图片`,
    };
  }

  // 验证文件大小
  if (file.size > EDITOR_IMAGE_CONFIG.maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${EDITOR_IMAGE_CONFIG.maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
};

/**
 * 处理编辑器图片上传（验证 + 压缩）
 */
export const processEditorImage = async (file: File): Promise<File> => {
  // 1. 验证文件
  const validation = validateEditorImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. 如果文件小于阈值，直接返回
  if (file.size < EDITOR_IMAGE_CONFIG.noCompressThreshold) {
    console.log('[图片压缩] 文件小于 1MB，跳过压缩');
    return file;
  }

  // 3. 压缩图片
  try {
    const compressedFile = await compressImage(file, {
      maxWidth: EDITOR_IMAGE_CONFIG.maxWidth,
      maxHeight: EDITOR_IMAGE_CONFIG.maxHeight,
      quality: EDITOR_IMAGE_CONFIG.quality,
    });

    console.log('[图片压缩] 原始大小:', (file.size / 1024).toFixed(2), 'KB');
    console.log('[图片压缩] 压缩后:', (compressedFile.size / 1024).toFixed(2), 'KB');

    return compressedFile;
  } catch (error) {
    console.error('图片压缩失败:', error);
    // 压缩失败则返回原文件
    return file;
  }
};
