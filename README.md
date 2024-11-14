<!--
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-13 13:54:11
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-14 15:09:13
-->
# Vue 3 + Typescript + Vite + cesium
据不完全统计，现有的很多都是按照[Cesium 官方的 webpack 教程](https://cesium.com/learn/cesiumjs-learn/cesiumjs-webpack/)（基本上使用vue3的都是搭配vuecli4.x）来开发的，很少使用vue3最优的vite工具开发实现，本demo项目使用Vue3.x、Vite2.x、Cesium.js进行开发，也方便学习和交流。

这里用到的是vite 搭配[vite-plugin-cesium](https://github.com/nshen/vite-plugin-cesium)，能很好实现在vite使用cesium。

### 安装

```shell
npm i vite-plugin-cesium vite -D
# yarn add vite-plugin-cesium vite -D
```

### 配置

在 `vite.config.js`使用插件配置

```shell
...
+ import cesium from 'vite-plugin-cesium';
export default defineConfig({
  ...
+  plugins: [cesium()]
});
```

### 项目运行

1. 克隆项目
```
# git clone https://github.com/guixianleng/vue-vite-cesium.git
```

2. 安装依赖

```shell
# npm install or yarn or pnpm i
```

3. 运行

```shell
# npm run dev or yarn dev or pnpm run dev
```
## 预览图
![preview](https://images.prismic.io/cesium/tutorials-imagery-layers-bing-labels.jpg?auto=compress%2Cformat&w=599)


![preview](https://images.prismic.io/cesium/tutorials-3d-tiles-styling-showAllBuildings.jpg?auto=compress%2Cformat&w=1040)

## 使用 Gitpod

在 Gitpod（适用于 GitHub 的免费在线开发环境）中打开项目，并立即开始编码.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/guixianleng/vue-vite-cesium)

核心功能实现：
1. WebSocket 接收坐标数据并更新模型位置：

在 startWebSocketListener 函数中，通过监听 WebSocket 的 onmessage 事件，接收到新的坐标数据后，计算模型的新位置并更新其 modelMatrix。
使用 Cesium.Matrix4.fromTranslation 来平移模型，根据接收到的坐标 longitude, latitude, height 来计算新的位置，并更新模型的位置。
2. 模型平滑移动：

当收到新的坐标数据时，计算模型的平移向量并应用平移矩阵。每次移动时，会通过 Matrix4.multiply 将平移矩阵应用到现有的 modelMatrix，从而平滑地更新模型的位置。
3. 围墙的闪烁效果：

在 addMovingModel 函数中，创建了一个围墙 wallEntity，并设置其材质为动态变化的透明度。
在 CallbackProperty 内，通过判断 flashing 状态来控制围墙的闪烁效果。当模型和围墙的距离小于 54 米时，flashing 为 true，启动闪烁；当距离大于等于 54 米时，flashing 为 false，停止闪烁并将围墙恢复到半透明状态。
4. 距离监测和闪烁控制：

每隔 100 毫秒，通过 setInterval 检查模型和围墙之间的距离，使用 Cesium.Cartesian3.distance 计算模型和围墙的位置差距。
如果距离小于 54 米，则设置 flashing = true，启动闪烁效果；如果距离大于等于 54 米，则设置 flashing = false，停止闪烁。
关键改进点：
1. WebSocket 数据的处理：
WebSocket 每次接收到的数据会更新模型的位置。确保每次数据到达时，模型的位置能够平滑过渡，而不会瞬间跳到新位置。
2. 闪烁控制的优化：
当围墙的 flashing 状态变化时，会通过透明度渐变（Cesium.Color.RED.withAlpha(x)）实现闪烁效果，并且当距离大于等于 54 米时会恢复默认透明度。
需要确认的地方：
1. WebSocket 数据的频率：
如果 WebSocket 发送的数据更新频率较高，模型会频繁地移动，需要确保平滑过渡（可能需要引入插值或缓冲机制来控制平滑移动）。
2. 闪烁效果的控制：
当前的逻辑是基于每 100 毫秒检查一次模型与围墙的距离，这个间隔可以根据需求调整，确保闪烁效果在动态场景中及时响应。