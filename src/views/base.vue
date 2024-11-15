<template>
  <cesium-map @select="handleSelect" v-model="value" @map-ready="mapOnReady" />
  <panel-menu v-model:visible="panelVisible" />
</template>

<script setup lang="ts">
  import { ref, onUnmounted, onMounted, provide } from 'vue'
  import { useRouter } from 'vue-router'
  import { addPointCloud3Dtiles, addMovingModels, wallEntity, updateWallFlashingEffect } from '/@/hooks/demo/setOSMBuildings'
  import { Cartesian3, Cesium3DTileset, Matrix4 } from 'cesium'

  const router = useRouter()
  provide('wallEntity', wallEntity);
  const value = ref<string>('base')
  const panelVisible = ref<boolean>(false)

  const message = ref('等待接收数据...')
  let socket: WebSocket

  // 模型数组，每个模型有不同的路径和id
  const models = [
    { id: 54, url: `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json` }
  ]

  const distance = 20 // 模型之间的距离
  const trajectory = [
  { "x": 121.39048943, "y": 31.0741399, "z": 18, "id": 54 },
  { "x": 121.39045845, "y": 31.07421795, "z": 18, "id": 54 },
  { "x": 121.3904275, "y": 31.07429599, "z": 18, "id": 54 },
  { "x": 121.39039655, "y": 31.07437403, "z": 18, "id": 54 },
  { "x": 121.3903656, "y": 31.07445208, "z": 18, "id": 54 },
  { "x": 121.39033464, "y": 31.07453013, "z": 18, "id": 54 },
  { "x": 121.39030369, "y": 31.07460817, "z": 18, "id": 54 },
  { "x": 121.39027274, "y": 31.07468622, "z": 18, "id": 54 },
  { "x": 121.39024179, "y": 31.07476427, "z": 18, "id": 54 },
  { "x": 121.39021084, "y": 31.07484231, "z": 18, "id": 54 },
  { "x": 121.39017989, "y": 31.07492036, "z": 18, "id": 54 },
  { "x": 121.39014894, "y": 31.07499841, "z": 18, "id": 54 },
  { "x": 121.39011799, "y": 31.07507646, "z": 18, "id": 54 },
  { "x": 121.39008704, "y": 31.0751545, "z": 18, "id": 54 },
  { "x": 121.39005609, "y": 31.07523255, "z": 18, "id": 54 },
  { "x": 121.39002513, "y": 31.0753106, "z": 18, "id": 54 },
  { "x": 121.39002513, "y": 31.07538865, "z": 18, "id": 54 },
]

  let mockDataIndex = 0

  const simulateWebSocket = () => {
    const interval = setInterval(() => {
      if (mockDataIndex >= trajectory.length) {
        clearInterval(interval)
        return
      }

      const data = trajectory[mockDataIndex]
      socket.onmessage({ data: JSON.stringify(data) })

      mockDataIndex++
    }, 1000) // 每秒发送一个位置数据
  }

  // 启动 WebSocket 监听器
  const startWebSocketListenerForModel = (tileset: Cesium3DTileset, modelId: number) => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const { x, y, z, id } = data

      if (id === modelId) {
        // 更新模型位置
        const offset = Cartesian3.fromDegrees(x, y, z)
        const origin = tileset.boundingSphere.center
        const translation = Cartesian3.subtract(offset, origin, new Cartesian3())

        const translationMatrix = Matrix4.fromTranslation(translation)
        tileset.modelMatrix = Matrix4.multiply(translationMatrix, tileset.modelMatrix, new Matrix4())
        // 每次更新模型位置后，检查与围墙的距离
        updateWallFlashingEffect(tileset, wallEntity, distance);
      }
    }
  }

  const handleSelect = (value: string) => {
    router.push({ name: value })
  }

  const mapOnReady = () => {
    addPointCloud3Dtiles(window.CViewer)
    models.forEach((model) => {
      const tileset = new Cesium3DTileset({
        url: model.url
      })

      tileset.readyPromise.then(() => {
        addMovingModels(window.CViewer, [model], distance)
        startWebSocketListenerForModel(tileset, model.id)
      })

      window.CViewer.scene.primitives.add(tileset)
    })

    // 启动 WebSocket 连接并模拟数据接收
    // socket = new WebSocket('ws://example.com')
    simulateWebSocketData()
  }

  // 启动 WebSocket 模拟
const simulateWebSocketData = () => {
  // 初始化模型的 WebSocket 模拟
  socket = {
    onmessage: (event: { data: string }) => {
      const data = JSON.parse(event.data);
      const { x, y, z, id } = data;

      // 查找对应的模型并更新位置
      if (id === 54) {  // 模型ID为54的吊机
        // 更新模型位置
        const offset = Cartesian3.fromDegrees(x, y, z);
        const tileset = models.find(model => model.id === id);
        if (tileset) {
          const origin = tileset.boundingSphere.center;
          const translation = Cartesian3.subtract(offset, origin, new Cartesian3());
          const translationMatrix = Matrix4.fromTranslation(translation);
          tileset.modelMatrix = Matrix4.multiply(translationMatrix, tileset.modelMatrix, new Matrix4());

          // 每次更新模型位置后，检查与围墙的距离
          updateWallFlashingEffect(tileset, wallEntity, distance);
        }
      }
    }
  };

  // 启动模拟 WebSocket 数据接收
  simulateWebSocket();
};
  onUnmounted(() => {
    if (socket) {
      socket.close()
    }
  })
</script>
