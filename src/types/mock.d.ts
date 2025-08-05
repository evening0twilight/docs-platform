// 为 JavaScript mock 文件添加类型声明
declare module '@/mock/data' {
  interface MockNode {
    id: string
    name: string
    type: 'folder' | 'file'
    children?: MockNode[]
    content?: any
    lastModified?: string
  }

  export const userFolders: MockNode
}
