/*
 * @Author: TonyJiangWJ
 * @Date: 2020-12-22 21:30:51
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-12-26 11:14:37
 * @Description: 开发测试时使用的组件
 */

let ImageViewer = {
  mixins: [mixin_methods],
  props: {
    image: {
      type: Object,
      default: () => {
        return {
          std: '',
          oldStd: '',
          avg: '',
          medianBottom: '',
          median: '',
          invalid: false,
          imageData: '',
          intervalImageData: '',
          grayImageData: '',
          originImageData: ''
        }
      }
    },
    imageStyle: {
      type: String,
      default: 'height:3rem;'
    },
    defaultImage: String
  },
  data: function () {
    return {
      target: 0
    }
  },
  methods: {
    toggleImage: function () {
      this.target++
      if (this.target >= 3) {
        this.target = 0
      }
    }
  },
  computed: {
    displayImageData: function () {
      if (this.target === 0) {
        return this.image.intervalImageData
      } else if (this.target === 1) {
        return this.image.grayImageData
      } else {
        return this.image.originImageData
      }
    }
  },
  watch: {
    defaultImage: function (v) {
      this.target = parseInt(v)
    }
  },
  template: '<img :src="displayImageData" :style="imageStyle" @click="toggleImage" />'
}

let ColorRangeSlider = {
  mixins: [mixin_methods],
  props: {
    lowerRange: {
      type: String,
      default: '#000000'
    },
    higherRange: {
      type: String,
      default: '#ffffff'
    }
  },
  data: function () {
    return {
      intervalRangeRed: [0, 0],
      intervalRangeGreen: [0, 0],
      intervalRangeBlue: [0, 0],
      showSlider: false,
      intervalByGray: false,
      showEditDialog: false,
      newLowerRange: 0,
      newHigherRange: 0,
      targetEditRange: ''
    }
  },
  methods: {
    fill2: function (o) {
      o = '' + o
      return new Array(3).join(0).substring(o.length) + o
    },
    toHex: function (v) {
      return this.fill2(v.toString(16))
    },
    editRange: function (target) {
      this.targetEditRange = target
      this.newLowerRange = this[target][0]
      this.newHigherRange = this[target][1]
      this.showEditDialog = true
    },
    resetRangeValue: function (v) {
      v = parseInt(v)
      if (v > 255) {
        return 255
      }
      if (v < 0) {
        return 0
      }
      return v
    },
    doConfirmRangeEdit: function () {
      if (this.isNotEmpty(this.targetEditRange)) {
        this.$set(this[this.targetEditRange], 0, this.resetRangeValue(this.newLowerRange))
        this.$set(this[this.targetEditRange], 1, this.resetRangeValue(this.newHigherRange))
      }
    },
    handleDragStart: function () {
      this.$emit('drag-start')
    },
    handleDragEnd: function () {
      this.$emit('drag-end')
    }
  },
  computed: {
    innerLowerRange: function () {
      if (this.intervalByGray) {
        let hex = this.toHex(this.intervalRangeRed[0])
        return ('#' + hex + hex + hex).toUpperCase()
      } else {
        return ('#' + this.toHex(this.intervalRangeRed[0]) + this.toHex(this.intervalRangeGreen[0]) + this.toHex(this.intervalRangeBlue[0])).toUpperCase()
      }
    },
    innerHigherRange: function () {
      if (this.intervalByGray) {
        let hex = this.toHex(this.intervalRangeRed[1])
        return ('#' + hex + hex + hex).toUpperCase()
      } else {
        return ('#' + this.toHex(this.intervalRangeRed[1]) + this.toHex(this.intervalRangeGreen[1]) + this.toHex(this.intervalRangeBlue[1])).toUpperCase()
      }
    }
  },
  filters: {
    hexDisplay: function (value) {
      let o = value.toString(16).toUpperCase()
      return value + '(' + new Array(3).join(0).substring(o.length) + o + ')'
    }
  },
  watch: {
    innerLowerRange: function (v) {
      this.$emit('lower-range-change', v)
    },
    innerHigherRange: function (v) {
      this.$emit('higher-range-change', v)
    },
    intervalByGray: function (v) {
      this.$emit('interval-by-gray', v)
    }
  },
  mounted () {
    let lowerRangeColor = parseInt(this.lowerRange.substring(1), 16)
    let higherRangeColor = parseInt(this.higherRange.substring(1), 16)
    this.$set(this.intervalRangeRed, 0, (lowerRangeColor >> 16) & 0xFF)
    this.$set(this.intervalRangeRed, 1, (higherRangeColor >> 16) & 0xFF)
    this.$set(this.intervalRangeGreen, 0, (lowerRangeColor >> 8) & 0xFF)
    this.$set(this.intervalRangeGreen, 1, (higherRangeColor >> 8) & 0xFF)
    this.$set(this.intervalRangeBlue, 0, lowerRangeColor & 0xFF)
    this.$set(this.intervalRangeBlue, 1, higherRangeColor & 0xFF)
  },
  template: '<div>\
    <van-divider content-position="left">\
      <label>灰度</label><van-switch v-model="intervalByGray" size="0.8rem" /> 二值化区间&nbsp;&nbsp;<span :style="innerLowerRange | styleTextColor">{{innerLowerRange}}</span>\
      &nbsp;&nbsp;-&nbsp;&nbsp;<span :style="innerHigherRange | styleTextColor">{{innerHigherRange}}</span>\
      <van-button @click="showSlider=true" size="mini">修改</van-button>\
    </van-divider>\
    <van-popup v-model="showSlider" position="bottom" :style="{ height: intervalByGray ? \'15%\' : \'30%\' }" :get-container="getContainer">\
      <div style="padding: 2rem 2rem;">\
        <van-row>\
          <van-col @click="editRange(\'intervalRangeRed\')">{{intervalByGray?"FULL":"RED"}}: {{intervalRangeRed[0] | hexDisplay}},{{intervalRangeRed[1] | hexDisplay}}</van-col>\
        </van-row>\
        <van-row>\
          <van-col :span="24">\
            <van-slider @drag-start="handleDragStart" @drag-end="handleDragEnd" style="margin: 1rem 0" v-model="intervalRangeRed" range :min="0" :max="255"/>\
          </van-col>\
        </van-row>\
        <template v-if="!intervalByGray">\
          <van-row>\
            <van-col @click="editRange(\'intervalRangeGreen\')">GREEN: {{intervalRangeGreen[0] | hexDisplay}},{{intervalRangeGreen[1] | hexDisplay}}</van-col>\
          </van-row>\
          <van-row>\
            <van-col :span="24"><van-slider @drag-start="handleDragStart" @drag-end="handleDragEnd" style="margin: 1rem 0" v-model="intervalRangeGreen" range :min="0" :max="255"/></van-col>\
          </van-row>\
          <van-row>\
            <van-col @click="editRange(\'intervalRangeBlue\')">BLUE: {{intervalRangeBlue[0] | hexDisplay}},{{intervalRangeBlue[1] | hexDisplay}}</van-col>\
          </van-row>\
          <van-row>\
            <van-col :span="24"><van-slider @drag-start="handleDragStart" @drag-end="handleDragEnd" style="margin: 1rem 0" v-model="intervalRangeBlue" range :min="0" :max="255"/></van-col>\
          </van-row>\
        </template>\
      </div>\
    </van-popup>\
    <van-dialog v-model="showEditDialog" title="手动输入" show-cancel-button @confirm="doConfirmRangeEdit" :get-container="getContainer">\
      <van-field v-model="newLowerRange" type="number" placeholder="请输入低阈值" label="低阈值" />\
      <van-field v-model="newHigherRange" type="number" placeholder="请输入高阈值" label="高阈值" />\
    </van-dialog>\
  </div>'
}

let CommonImageTest = {
  mixins: [mixin_methods],
  components: {
    ImageViewer, ColorRangeSlider
  },
  data: function () {
    return {
      loading: false,
      timeout: null,
      draging: false,
      dragingTimeout: null,
      intervalByGray: false,
      intervalBase64Only: false,
      targetDefaultImage: '0',
      lowerRange: '#ad8500',
      higherRange: '#f4ddff',
      image: {
        intervalImageData: '',
        grayImageData: '',
        originImageData: ''
      }
    }
  },
  methods: {
    chooseImg: function (e) {
      var files = e.target.files
      if (files && files.length > 0) {
        let reader = new FileReader()
        let self = this
        reader.readAsDataURL(files[0])
        reader.onload = function (e) {
          self.image.intervalImageData = this.result
          self.image.grayImageData = this.result
          self.image.originImageData = this.result
        }
      }
    },
    doLoadImage: function (reloadAll) {
      if (this.loading) {
        return
      }
      if (reloadAll) {
        this.intervalBase64Only = false
      }
      this.loading = true
      $nativeApi.request('loadImageInfo', this.filterOption)
        .then(resp => {
          if (resp.success) {
            if (!this.intervalBase64Only) {
              this.image = resp.image
              this.intervalBase64Only = true
            } else {
              this.image.intervalImageData = resp.image.intervalImageData
            }
          }
          this.loading = false
        })
    },
    handleLowerRange: function (v) {
      this.lowerRange = v
    },
    handleHigherRange: function (v) {
      this.higherRange = v
    },
    handleIntervalByGray: function (v) {
      this.intervalByGray = v
    },
    handleDragingEnd: function (v) {
      let self = this
      if (this.dragingTimeout !== null) {
        clearTimeout(this.dragingTimeout)
      }
      this.dragingTimeout = setTimeout(function () {
        self.draging = false
        self.doLoadImage()
      }, 100)
    }
  },
  computed: {
    filterOption: function () {
      return {
        intervalByGray: this.intervalByGray,
        lowerRange: this.lowerRange,
        higherRange: this.higherRange,
        intervalBase64Only: this.intervalBase64Only
      }
    }
  },
  watch: {
    filterOption: {
      deep: true,
      handler: function () {
        console.log('filterOption changed')
        if (this.timeout != null || this.draging) {
          clearTimeout(this.timeout)
        } 
        if (!this.draging) {
          let self = this
          this.timeout = setTimeout(function () {
            // 延迟100毫秒执行加载
            self.doLoadImage()
            self.timeout = null
          }, 100)
        }
      }
    }
  },
  mounted () {
    this.doLoadImage()
  },
  template: '<div>\
    <tip-block>请保存需要调试的图片到 test/visual_test/测试用图片.png 路径下</tip-block>\
    <van-divider content-position="left">\
      测试图片&nbsp;&nbsp;&nbsp;<van-button size="mini" @click="doLoadImage(true)">加载图片</van-button>\
    </van-divider>\
    <van-row type="flex" justify="left">\
      <van-col offset="1">\
        <van-radio-group v-model="targetDefaultImage" direction="horizontal" icon-size="15">\
        <van-radio style="margin-top: 5px;" shape="square" name="0">二值化</van-radio>\
          <van-radio style="margin-top: 5px;" shape="square" name="1">灰度</van-radio>\
          <van-radio style="margin-top: 5px;" shape="square" name="2">原图</van-radio>\
        </van-radio-group>\
      </van-col>\
    </van-row>\
    <color-range-slider :lower-range="lowerRange" :higher-range="higherRange" \
        @drag-start="draging=true" @drag-end="handleDragingEnd" \
        @interval-by-gray="handleIntervalByGray"\
        @lower-range-change="handleLowerRange"\
        @higher-range-change="handleHigherRange"/>\
    <ImageViewer :image="image" image-style="width:100%;" :default-image="targetDefaultImage" />\
    <van-overlay :show="loading">\
      <van-loading type="spinner" class="wrapper" />\
    </van-overlay>\
  </div>'
}