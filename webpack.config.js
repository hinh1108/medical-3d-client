const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  
  devtool: 'inline-source-map',
  
  devServer: {
    static: './dist',
    hot: false,
    liveReload: false,
    port: 3000,
    open: true,
    historyApiFallback: true,
    client: false,
    webSocketServer: false
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      title: 'Medical 3D Imaging Tool'
    })
  ],
  
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  
  resolve: {
    fallback: {
      "fs": false,
      "path": false
    }
  },
  
  experiments: {
    asyncWebAssembly: true
  }
};