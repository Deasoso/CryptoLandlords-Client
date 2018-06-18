var path = require('path')
var webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015']
        },
        exclude: [/node_modules/],
        // include: [resolve('src'),resolve('test'),resolve('/node_modules/iview/src'),resolve('/node_modules/iview/packages')],
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.common.js',
      '@': path.resolve('src'),
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      // 'DDZ_WS_ADDRESS': JSON.stringify("ws://localhost:34568"),//47.106.69.165
      'DDZ_WS_ADDRESS': JSON.stringify("ws://47.106.69.165:34568"),//47.106.69.165
      //34567 for eth, 34568 for neb
      'DDZ_UNKNOWN' : -1,
      'DDZ_DEBUG': process.env.NODE_ENV !== 'production'
    })
  ]
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true,
    //   compress: {
    //     warnings: false
    //   }
    // }),
    new UglifyJsPlugin({

      // 使用外部引入的新版本的js压缩工具
      
      parallel: true,
      
      uglifyOptions: {
      
      ie8: false,
      
      ecma: 6,
      
      warnings: false,
      
      mangle: true,
      // debug false
      
      output: {
      
      comments: false,
      
      beautify: false,
      // debug true
      // sourceMap: true,

      },
      
      compress: {
      
      // 删除所有的 `console` 语句
      
      // 还可以兼容ie浏览器
      
      drop_console: 
      true,
      
      // 内嵌定义了但是只用到一次的变量
      
      collapse_vars: 
      true,
      
      // 提取出出现多次但是没有定义成变量去引用的静态值
      
      reduce_vars: 
      true,
      
      // 在UglifyJs删除没有用到的代码时不输出警告
      
      warnings: false
      }
      }
      }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
