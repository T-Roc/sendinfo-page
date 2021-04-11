const { src, dest, parallel, series, watch}  = require('gulp');

// 删除插件
const del = require('del')

const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()

// 页面渲染模拟数据
const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

const clean = () => {
  return del(['dist', 'temp'])
}

const style = () => {
  return src('./src/assets/styles/*.scss', 
    // 这里是指定基础的目录结构
    { base: 'src' }
  )
  // 默认 _xx.scss 开头的 sass 文件不会被转化，因为被视做私有样式文件
  // outputStyle: 'extend' 是将 {} 完全展开符合我们的 css 编写习惯 👇
  // {
  //   width: 100px;}
  // 变为：
  // {
  //   width: 100px;
  // }
  .pipe(plugins.sass({ outputStyle: 'extend'}))
  .pipe(dest('temp')) 
  .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src('./src/assets/scripts/*.js', { base: 'src' })
  .pipe(plugins.babel({presets: ['@babel/preset-env']}))
  .pipe(dest('temp'))
  .pipe(bs.reload({ stream: true }))
}

const html = () => {
  return src('./src/*.html', { base: 'src' })
  .pipe(plugins.swig({ data }))
  .pipe(dest('temp'))
  .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src('./src/assets/images/**', { base: 'src' })
  .pipe(plugins.imagemin())
  .pipe(dest('dist'))
}

const font = () => {
  return src('./src/assets/fonts/**', { base: 'src' })
  .pipe(plugins.imagemin())
  .pipe(dest('dist'))
}

const extra = () => {
  return src('./public/**', { base: 'public' })
  .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/styles/*.js', script)
  watch('src/*.html', html)
  // watch('src/assets/images/**', image)
  // watch('src/assets/font/**', font)
  // watch('public/**', extra)

  watch([
    'src/assets/images/**',
    'src/assets/font/**',
    'src/*.html'
  ], bs.reload)
  

  bs.init({
    notify: false, // 页面提示
    port: 2080,
    // open: true, // 自动打开浏览器？
    files: 'dist/*', // 该指定目录下面的文件变化时，服务自动更新
    server: {
      baseDir: ['temp', 'src', 'public'], // 基准目录
      routes: {
        '/node_modules': 'node_modules' // 自定义映射路径，优先级高于 baseDir
      }
    }
  })
}

const useref = () => {
  return src('./temp/*.html', { base: 'temp' })
  .pipe(plugins.useref({ searchPath: ['temp', '.']}))
  .pipe(plugins.if(/\.js$/, plugins.uglify()))
  .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/, plugins.htmlmin({ 
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
  })))
  .pipe(dest('dist'))
}

// 并行处理
const compile = parallel(style, script, html)

const build = series(clean, parallel( series(compile, useref),image, font, extra)) 

const develop = series(compile, serve)

module.exports = {
  build,
  clean,
  develop,
}