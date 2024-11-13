<!--
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-12 16:41:29
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-13 17:22:27
-->
<template>
  <cesium-map @select="handleSelect" v-model="value" @map-ready="mapOnReady" />
  <panel-menu v-model:visible="panelVisible" />
</template>
<script setup lang="ts">
  import { ref, onUnmounted, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  // import useGlobalRotate from '/@/hooks/functional/useRotate'
  import { addPointCloud3Dtiles, addMovingModel, startWebSocketListener } from '/@/hooks/demo/setOSMBuildings'

  const router = useRouter()

  const value = ref<string>('base')
  const panelVisible = ref<boolean>(false)

  const message = ref('等待接收数据...');
  let socket: WebSocket;

  const handleSelect = (value: string) => {
    router.push({ name: value })
  }
  const mapOnReady = () => {
    // const { startRotate } = useGlobalRotate(window.CViewer)
    // startRotate({ multiplier: 300 })
    // 添加点云模型
    addPointCloud3Dtiles(window.CViewer);
    // 添加吊机模型
    let tileset = addMovingModel(window.CViewer);
    startWebSocketListener(socket, tileset);
  }

  onMounted(() => {
      // 创建 WebSocket 连接
      socket = new WebSocket('ws://localhost:8080/ws');
      // 监听消息
      socket.onmessage = (event) => {
        message.value = event.data;
      };

      // 处理 WebSocket 错误
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // 处理 WebSocket 连接关闭
      socket.onclose = () => {
        console.log('WebSocket 连接已关闭');
      };
  })
  onUnmounted(() => {
    // const { stopRotate } = useGlobalRotate(window.CViewer)
    // stopRotate()
    if (socket) {
        socket.close();
    }
  })
</script>
