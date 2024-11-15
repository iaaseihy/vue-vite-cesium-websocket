<!--
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-12 16:41:29
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-15 14:29:10
-->
<template>
  <cesium-map @select="handleSelect" v-model="value" @map-ready="mapOnReady" />
  <panel-menu v-model:visible="panelVisible" />
</template>
<script setup lang="ts">
  import { ref, onUnmounted, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  // import useGlobalRotate from '/@/hooks/functional/useRotate'
  import { addPointCloud3Dtiles, addMovingModels, startWebSocketListener } from '/@/hooks/demo/setOSMBuildings'
import { Cartesian3, Cesium3DTileset, Matrix4 } from 'cesium'

  const router = useRouter()

  const value = ref<string>('base')
  const panelVisible = ref<boolean>(false)

  const message = ref('等待接收数据...');
  let socket: WebSocket;

  // 模型数组，每个模型有不同的路径和id
  const models = [
    { id: 54, url: `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json` },
    { id: 55, url: `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json` },
    { id: 56, url: `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json` }
  ];

  const tilesets: Cesium3DTileset[] = [];

    // 模拟 WebSocket 数据
    let mockData = [
      { id: 54, x: 121.3905, y: 31.0742, z: 18 },
      { id: 55, x: 121.3907, y: 31.0744, z: 19 },
      { id: 56, x: 121.3910, y: 31.0746, z: 20 },
    ];

    // 模拟 WebSocket 接收数据，并更新模型位置
    const simulateWebSocket = () => {
      let count = 0;
      const interval = setInterval(() => {
        const data = mockData[count % mockData.length];
        count++;
        
        // 模拟 WebSocket 发送的数据
        socket.onmessage({ data: JSON.stringify(data) });

        if (count > 19) {
          clearInterval(interval); // 模拟 20秒数据
        }
      }, 1000); // 每秒传输一组数据
    };

    // 启动 WebSocket 监听器
    const startWebSocketListenerForModel = (tileset: Cesium3DTileset, modelId: number) => {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        const { x, y, z, id } = data;
        if (id === modelId) {
          // 更新模型位置
          const offset = Cartesian3.fromDegrees(x, y, z);
          const origin = tileset.boundingSphere.center;
          const translation = Cartesian3.subtract(offset, origin, new Cartesian3());

          const translationMatrix = Matrix4.fromTranslation(translation);
          tileset.modelMatrix = Matrix4.multiply(translationMatrix, tileset.modelMatrix, new Matrix4());
        }
      };
    };
    
  const handleSelect = (value: string) => {
    router.push({ name: value })
  }
  const mapOnReady = () => {
    // const { startRotate } = useGlobalRotate(window.CViewer)
    // startRotate({ multiplier: 300 })
    // 添加点云模型
    addPointCloud3Dtiles(window.CViewer);
    // 添加吊机模型
    let tileset = addMovingModels(window.CViewer, models, 66);
    startWebSocketListener(socket);
  }

  // onMounted(() => {
  //     // 创建 WebSocket 连接
  //     socket = new WebSocket('ws://localhost:8080/ws');
  //     // 监听消息
  //     socket.onmessage = (event) => {
  //       message.value = event.data;
  //     };

  //     // 处理 WebSocket 错误
  //     socket.onerror = (error) => {
  //       console.error('WebSocket error:', error);
  //     };

  //     // 处理 WebSocket 连接关闭
  //     socket.onclose = () => {
  //       console.log('WebSocket 连接已关闭');
  //     };
  // })

  // WebSocket 模拟创建
  onMounted(() => {
    socket = new WebSocket('ws://localhost:8080/ws')
    simulateWebSocket()

    models.forEach((model) => {
      const tileset = new Cesium3DTileset({
        url: model.url
      })

      tileset.readyPromise.then(() => {
        addMovingModels(window.CViewer, [model], 66)
        startWebSocketListenerForModel(tileset, model.id)
      })

      window.CViewer.scene.primitives.add(tileset)
    })
  })

  onUnmounted(() => {
    // const { stopRotate } = useGlobalRotate(window.CViewer)
    // stopRotate()
    if (socket) {
        socket.close();
    }
  })

  
</script>
