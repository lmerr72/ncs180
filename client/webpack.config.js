const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src/main.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      react$: require.resolve('react'),
      'react-dom$': require.resolve('react-dom'),
      'react/jsx-runtime': require.resolve('react/jsx-runtime')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html')
    })
  ],
  devServer: {
    port: 5173,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ['/api', '/graphql'],
        target: 'http://localhost:3001'
      }
    ]
  }
};
