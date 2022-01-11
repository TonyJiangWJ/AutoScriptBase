let Index = {
  mixins: [mixin_methods],
  data: function () {
    return {
      menuItems: [
        {
          title: '锁屏设置',
          link: '/basic/lock'
        },
        {
          title: '悬浮窗设置',
          link: '/basic/floaty'
        },
        {
          title: '日志设置',
          link: '/basic/log'
        },
        {
          title: '前台应用白名单设置',
          link: '/advance/skipPackage'
        },
        {
          title: '高级设置',
          link: '/advance/common'
        },
        {
          title: '关于项目',
          link: '/about'
        },
      ]
    }
  },
  methods: {
    routerTo: function (path) {
      this.$router.push(path)
    }
  },
  template: `<div>
    <van-cell-group>
      <van-cell :title="item.title" is-link v-for="item in menuItems" :key="item.link" @click="routerTo(item.link)"/>
    </van-cell-group>
  </div>`
}
