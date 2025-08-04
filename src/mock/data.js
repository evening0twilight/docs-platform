// mockData.js
export const userFolders = {
  id: 'root',
  name: '我的文档',
  type: 'folder',
  children: [
    {
      id: 'work',
      name: '工作文档',
      type: 'folder',
      children: [
        {
          id: 'project-a',
          name: '项目A',
          type: 'folder',
          children: [
            {
              id: 'doc-101',
              name: '项目需求文档',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: '项目A需求文档' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '这是' },
                      { type: 'text', marks: [{ type: 'bold' }], text: '项目A' },
                      { type: 'text', text: '的详细需求说明文档。' }
                    ]
                  },
                  {
                    type: 'bulletList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '功能需求' }]
                          }
                        ]
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '性能需求' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              lastModified: '2023-10-15T08:30:00Z'
            },
            {
              id: 'doc-102',
              name: '项目进度报告',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: '项目进度' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '当前进度：' },
                      { type: 'text', marks: [{ type: 'highlight' }], text: '75%' }
                    ]
                  },
                  {
                    type: 'table',
                    content: [
                      {
                        type: 'tableRow',
                        content: [
                          { type: 'tableHeader', content: [{ type: 'text', text: '任务' }] },
                          { type: 'tableHeader', content: [{ type: 'text', text: '负责人' }] },
                          { type: 'tableHeader', content: [{ type: 'text', text: '状态' }] }
                        ]
                      },
                      {
                        type: 'tableRow',
                        content: [
                          { type: 'tableCell', content: [{ type: 'text', text: 'UI设计' }] },
                          { type: 'tableCell', content: [{ type: 'text', text: '张三' }] },
                          { type: 'tableCell', content: [{ type: 'text', text: '已完成' }] }
                        ]
                      }
                    ]
                  }
                ]
              },
              lastModified: '2023-10-20T14:15:00Z'
            }
          ]
        },
        {
          id: 'meetings',
          name: '会议记录',
          type: 'folder',
          children: [
            {
              id: 'doc-201',
              name: '2023-10-01 项目启动会',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: '项目启动会议记录' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '时间：2023年10月1日 14:00-15:30' }
                    ]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '参会人员：' },
                      { type: 'text', marks: [{ type: 'bold' }], text: '张三、李四、王五' }
                    ]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '会议内容：' }
                    ]
                  },
                  {
                    type: 'orderedList',
                    attrs: { order: 1 },
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '项目背景介绍' }]
                          }
                        ]
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '目标与范围确认' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              lastModified: '2023-10-01T16:00:00Z'
            }
          ]
        }
      ]
    },
    {
      id: 'personal',
      name: '个人文档',
      type: 'folder',
      children: [
        {
          id: 'notes',
          name: '学习笔记',
          type: 'folder',
          children: [
            {
              id: 'doc-301',
              name: 'React学习笔记',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'React核心概念' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'React是一个用于构建用户界面的JavaScript库。' }
                    ]
                  },
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: '组件' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '组件是React的核心概念之一。' }
                    ]
                  },
                  {
                    type: 'codeBlock',
                    attrs: { language: 'javascript' },
                    content: [
                      {
                        type: 'text',
                        text: 'function Welcome(props) {\n  return <h1>Hello, {props.name}</h1>;\n}'
                      }
                    ]
                  }
                ]
              },
              lastModified: '2023-09-15T10:20:00Z'
            }
          ]
        },
        {
          id: 'diary',
          name: '日记',
          type: 'folder',
          children: [
            {
              id: 'doc-401',
              name: '2023-10-10 日记',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 3 },
                    content: [{ type: 'text', text: '2023年10月10日 星期二 晴' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '今天是个好天气，我完成了项目的一个重要功能。' }
                    ]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '中午和同事一起吃了火锅，味道不错。' }
                    ]
                  }
                ]
              },
              lastModified: '2023-10-10T22:00:00Z'
            }
          ]
        }
      ]
    },
    {
      id: 'shared',
      name: '共享文件夹',
      type: 'folder',
      children: [
        {
          id: 'team-docs',
          name: '团队文档',
          type: 'folder',
          children: [
            {
              id: 'doc-501',
              name: '团队规范',
              type: 'file',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: '团队开发规范' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '本规范适用于所有团队成员，请严格遵守。' }
                    ]
                  },
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: '代码规范' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '1. 使用ESLint进行代码检查' }
                    ]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: '2. 提交代码前必须通过所有测试' }
                    ]
                  }
                ]
              },
              lastModified: '2023-09-01T09:00:00Z'
            }
          ]
        }
      ]
    }
  ]
};
