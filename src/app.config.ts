export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/family/index',
    'pages/upload/index',
    'pages/appointment/index',
    'pages/guide/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2B8C8C',
    navigationBarTitleText: 'MRI预约核验',
    navigationBarTextStyle: 'white'
  },
  plugins: {
    WechatSI: {
      version: '0.3.5',
      provider: 'wx069ba97219f66d99',
    },
  },
  tabBar: {
    color: '#8AA0A0',
    selectedColor: '#2B8C8C',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '自测'
      },
      {
        pagePath: 'pages/family/index',
        text: '家属协助'
      },
      {
        pagePath: 'pages/upload/index',
        text: '资料上传'
      },
      {
        pagePath: 'pages/appointment/index',
        text: '预约确认'
      },
      {
        pagePath: 'pages/guide/index',
        text: '到院指引'
      }
    ]
  }
})
