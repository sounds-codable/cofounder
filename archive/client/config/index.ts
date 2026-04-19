import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import path from 'path'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport = {
    projectName: 'hehuozao-client',
    date: '2026-2-5',
    designWidth: 375,
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-html'],
    defineConstants: {
      'process.env.TARO_APP_API_BASE': JSON.stringify(process.env.TARO_APP_API_BASE || ''),
    },
    copy: {
      patterns: [],
      options: {}
    },
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: false
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        url: {
          enable: true,
          config: {
            limit: 1024
          }
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      router: {
        mode: 'browser',
        customRoutes: {
          '/pages/index': '/',
        },
      },
      esnextModules: ['taro-ui'],
      webpackChain(chain) {
        // 抑制 @tarojs/components 的 webpackExports 警告
        chain.set('ignoreWarnings', [
          /You don't need `webpackExports`/
        ])
      },
      htmlPluginOption: {
        template: path.resolve(__dirname, '..', 'src/index.html'),
        inject: true,
        minify: {
          collapseWhitespace: true,
          removeComments: true
        }
      },
      output: {
        filename: 'js/[name].[contenthash:8].js',
        chunkFilename: 'js/[name].[contenthash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[contenthash].css',
        chunkFilename: 'css/[name].[contenthash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      devServer: {
        port: 10086,
        historyApiFallback: true,
        proxy: {
          '/api': {
            target: 'http://localhost:3010',
            changeOrigin: true
          }
        }
      }
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false,
        }
      }
    }
  }
  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})

