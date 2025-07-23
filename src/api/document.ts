// 文档相关API
import { request } from '@/utils/request'

// // 获取文档树结构
// export const getDocumentTree = async () => {
//   return request({
//     url: '/api/documents/tree',
//     method: 'GET'
//   })
// }

// 在api/document.ts中添加
const mockTreeData = [
  {
    id: '1',
    name: '项目文档',
    type: 'folder',
    path: '/project',
    children: [
      {
        id: '2',
        name: '需求文档',
        type: 'file',
        path: '/project/requirements'
      },
      {
        id: '3',
        name: '设计文档',
        type: 'file',
        path: '/project/design'
      }
    ]
  },
  {
    id: '4',
    name: '个人笔记',
    type: 'folder',
    path: '/personal',
    children: [
      {
        id: '5',
        name: '学习笔记',
        type: 'folder',
        path: '/personal/study',
        children: [
          {
            id: '6',
            name: 'Vue3笔记',
            type: 'file',
            path: '/personal/study/vue'
          },
          {
            id: '7',
            name: 'TypeScript笔记',
            type: 'file',
            path: '/personal/study/typescript'
          }
        ]
      }
    ]
  }
]

export const getDocumentTree = async () => {
  // 实际开发中替换为真实API调用
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockTreeData)
    }, 500)
  })
}