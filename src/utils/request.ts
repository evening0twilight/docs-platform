import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { Message } from '@arco-design/web-vue'
import router from '@/router'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量获取基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么

    // 1. 添加token到请求头
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    // 如果没有token且不是登录/注册请求，可能需要跳转到登录页
    if (!token && config.url && 
        !config.url.includes('/login') && 
        !config.url.includes('/register')) {
      console.warn('请求时未找到token，可能需要重新登录');
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 2. 处理 FormData，删除 Content-Type 让浏览器自动设置
    if (config.data instanceof FormData) {
      // 删除默认的 Content-Type，让浏览器自动设置为 multipart/form-data 并添加 boundary
      delete config.headers['Content-Type']
    }

    // 3. 不再添加时间戳参数（已删除）
    // 如果需要防止缓存，可以在服务端设置Cache-Control头

    // 4. 显示loading（可选）
    // 可以在这里添加全局loading状态

    console.log('请求发送:', config)
    return config
  },
  (error: AxiosError) => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 2xx 范围内的状态码都会触发该函数
    // 对响应数据做点什么

    // 隐藏loading（可选）
    
    const { data, status } = response
    
    // 1. 检查HTTP状态码（2xx都视为成功）
    if (status >= 200 && status < 300) {
      // 对于204 No Content，直接返回成功标识
      if (status === 204) {
        return { success: true, message: '操作成功' }
      }
      
      // 对于有数据的响应，检查业务状态码
      if (data && typeof data === 'object') {
        // 检查后端返回的 statusCode 字段（优先级最高）
        if (data.statusCode !== undefined) {
          if (data.statusCode === 200 || data.statusCode === 201) {
            // 智能返回策略：
            // 1. 如果有 data 字段且不为空对象，返回 data 的内容（如登录接口）
            // 2. 如果没有 data 字段或 data 为空，返回完整响应（如验证码接口）
            if (data.data !== undefined && data.data !== null && Object.keys(data.data).length > 0) {
              return data.data // 返回 data 字段的内容
            } else {
              return data // 返回完整数据
            }
          } else {
            // 业务错误
            const errorMessage = data.message || '请求失败'
            Message.error(errorMessage)
            return Promise.reject(new Error(errorMessage))
          }
        }
        // 检查后端返回的 code 字段
        else if (data.code !== undefined) {
          if (data.code === 200) {
            return data.data || data // 返回实际数据
          } else {
            // 业务错误
            const errorMessage = data.message || '请求失败'
            Message.error(errorMessage)
            return Promise.reject(new Error(errorMessage))
          }
        }
        // 如果后端返回了 success 标识
        else if (data.success === true) {
          return data.data || data
        }
        // 没有明确的状态码字段，假设成功
        else {
          return data
        }
      }
      
      // 直接返回数据
      return data || { success: true }
    }
    
    return response
  },
  (error: AxiosError) => {
    // 超出 2xx 范围的状态码都会触发该函数
    // 对响应错误做点什么

    // 隐藏loading（可选）
    
    console.error('响应错误:', error)
    
    const { response, message } = error
    
    if (response) {
      // 服务器返回了错误状态码
      const { status, data } = response
      
      // 提取后端返回的错误信息
      const backendMessage = (data as any)?.message || ''
      
      switch (status) {
        case 400:
          Message.error(backendMessage || '请求参数错误')
          break
        case 401:
          Message.error(backendMessage || '登录已过期，请重新登录')
          // 清除token并跳转到登录页
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          // 跳转到登录页
          setTimeout(() => {
            if (router.currentRoute.value.path !== '/login') {
              router.push('/login')
            }
          }, 1000)
          break
        case 403:
          Message.error(backendMessage || '权限不足')
          break
        case 404:
          Message.error(backendMessage || '请求的资源不存在')
          break
        case 500:
          Message.error(backendMessage || '服务器内部错误')
          break
        case 502:
          Message.error(backendMessage || '网关错误')
          break
        case 503:
          Message.error(backendMessage || '服务不可用')
          break
        case 504:
          Message.error(backendMessage || '网关超时')
          break
        default:
          Message.error(backendMessage || `请求失败 (${status})`)
      }
    } else if (message.includes('timeout')) {
      // 请求超时
      Message.error('请求超时，请稍后重试')
    } else if (message.includes('Network Error')) {
      // 网络错误
      Message.error('网络连接失败，请检查网络')
    } else {
      // 其他错误
      Message.error('请求失败，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

// 封装常用的请求方法
export const http = {
  get<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.put(url, data, config)
  },

  patch<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.patch(url, data, config)
  },

  delete<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.delete(url, config)
  },

  upload<T = any>(url: string, formData: FormData, config?: InternalAxiosRequestConfig): Promise<T> {
    return request.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  }
}

export default request
