<template>
  <cesium-map @select="handleSelect" v-model="value" @map-ready="mapOnReady" />
  <panel-menu v-model:visible="panelVisible" />
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { addPointCloud3Dtiles, addMovingModels, wallEntity, updateWallFlashingEffect } from '/@/hooks/demo/setOSMBuildings'
import { CallbackProperty, Cartesian3, Cesium3DTileset, ClockRange, Color, ColorMaterialProperty, HermitePolynomialApproximation, JulianDate, Matrix4, PolylineGlowMaterialProperty, SampledPositionProperty, VelocityOrientationProperty, Viewer } from 'cesium'
import * as Cesium from 'cesium';

const router = useRouter()
provide('wallEntity', wallEntity);
const value = ref<string>('base')
const panelVisible = ref<boolean>(false)

const message = ref('等待接收数据...')
let socket: WebSocket
let wallEntityModel: any
// 模型数组，每个模型有不同的路径和id
const models = [
  { id: 54, url: `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json` }
]

const distance = 20 // 模型之间的距离
// 定义全局的透明度变化状态
let x = 1;  // 透明度初始值
let flog = true;  // 控制透明度增减
let flashing = false;  // 控制是否闪烁
const trajectory = [
  { "x": 121.39048943, "y": 31.0741399, "z": 18, "id": 54, time: 0 },
  { "x": 121.39045845, "y": 31.07421795, "z": 18, "id": 54, time: 1 },
  { "x": 121.3904275, "y": 31.07429599, "z": 18, "id": 54, time: 2 },
  { "x": 121.39039655, "y": 31.07437403, "z": 18, "id": 54, time: 3 },
  { "x": 121.3903656, "y": 31.07445208, "z": 18, "id": 54, time: 4 },
  { "x": 121.39033464, "y": 31.07453013, "z": 18, "id": 54, time: 5 },
  { "x": 121.39030369, "y": 31.07460817, "z": 18, "id": 54, time: 6 },
  { "x": 121.39027274, "y": 31.07468622, "z": 18, "id": 54, time: 7 },
  { "x": 121.39024179, "y": 31.07476427, "z": 18, "id": 54, time: 8 },
  { "x": 121.39021084, "y": 31.07484231, "z": 18, "id": 54, time: 9 },
  { "x": 121.39017989, "y": 31.07492036, "z": 18, "id": 54, time: 10 },
  { "x": 121.39014894, "y": 31.07499841, "z": 18, "id": 54, time: 11 },
  { "x": 121.39011799, "y": 31.07507646, "z": 18, "id": 54, time: 12 },
  { "x": 121.39008704, "y": 31.0751545, "z": 18, "id": 54, time: 13 },
  { "x": 121.39005609, "y": 31.07523255, "z": 18, "id": 54, time: 14 },
  { "x": 121.39002513, "y": 31.0753106, "z": 18, "id": 54, time: 15 },
  { "x": 121.39002513, "y": 31.07538865, "z": 18, "id": 54, time: 16 },
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
  //     let boundingSphere = {
  //     "center": {
  //         "x": -2847916.131570683,
  //         "y": 4667530.239287404,
  //         "z": 3272989.1747708023
  //     },
  //     "radius": 155.44303661927108
  // }
  // window.CViewer.scene.camera.flyToBoundingSphere(boundingSphere);

  const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(121.39048943, 31.0741399, 0), 500);

  window.CViewer.scene.camera.flyToBoundingSphere(boundingSphere, {
    duration: 2 // 飞行持续时间
  });

  setTimeout(() => {
    addWallEffect(window.CViewer);
    const point = { lng: 121.397179, lat: 31.074184 };
    const isInside = isPointInsideWall(window.CViewer, wallEntityModel, point);
    console.log("点是否在围墙内部:", isInside);
    simulateModelMoving(window.CViewer, trajectory, 30);
  }, 4000); // 等待 flyToBoundingSphere 完成
  // models.forEach((model) => {
  //   const tileset = new Cesium3DTileset({
  //     url: model.url
  //   })

  //   tileset.readyPromise.then(() => {
  //     addMovingModels(window.CViewer, [model], distance)
  //     startWebSocketListenerForModel(tileset, model.id)
  //   })

  //   window.CViewer.scene.primitives.add(tileset)
  // })

  // // 启动 WebSocket 连接并模拟数据接收
  // // socket = new WebSocket('ws://example.com')
  // simulateWebSocketData()


  //     addWallEffect(window.CViewer);
  //     // addModelEntity(window.CViewer, models);
  //     const point = { lng: 121.397179, lat: 31.074184 }; // 要判断的点
  // const isInside = isPointInsideWall(window.CViewer, wallEntityModel, point);
  // console.log("点是否在围墙内部:", isInside);
  //     simulateModelMoving(window.CViewer, trajectory, 30);
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

const addModelEntity = (viewer: Viewer, models: any[]) => {
  const position = Cartesian3.fromDegrees(
    121.39048943,
    31.0741399,
    18.0
  );
  models && models.forEach((point) => {
    const entity = viewer.entities.add({
      id: point.id,
      name: point.id,
      position: position,
      model: {
        uri: 'gltf/diaoche.glb',
        minimumPixelSize: 128, // 最小像素尺寸
        maximumScale: 20, // 最大比例
        scale: 0.01 // 比例
      },
      path: {
        resolution: 1,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Color.YELLOW
        }),
        // leadTime、trailTime 不设置 path全显示
        // leadTime:0,// 设置为0时 模型通过后显示path
        trailTime: 0,// 设置为0时 模型通过后隐藏path
        width: 10
      }
    })
  });
  viewer.scene.globe.enableLighting = true; // 开启光照
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = true;
  bloom.uniforms.glowOnly = false;
  bloom.uniforms.contrast = 128;
  bloom.uniforms.brightness = -0.45;
};

const addWallEffect = (viewer: Viewer) => {
  // 创建围墙并保存实体引用
  wallEntityModel = viewer.entities.add({
    name: "围墙",
    position: Cartesian3.fromDegrees(121.390179, 31.074584, 19),
    box: {
      dimensions: new Cartesian3(10, 10, 5),
      material: new ColorMaterialProperty(Color.RED.withAlpha(0.5)),
    }
  });
};

const simulateModelMoving2 = (viewer: Viewer, trajectory: any[]) => {
  // Define the total duration as the length of the trajectory in seconds
  const totalDuration = trajectory.length; // Total duration in seconds
  const numPoints = trajectory.length;
  const timeInterval = totalDuration / (numPoints - 1); // Time interval between each point

  // Create an array to store the position data
  const positionData = [];
  for (let i = 0; i < trajectory.length; ++i) {
    positionData.push({
      longitude: Number(trajectory[i].x),
      latitude: Number(trajectory[i].y),
      height: Number(trajectory[i].z),
      time: i * timeInterval // Adjusted time interval
    });
  }

  // Create a sampled position property for interpolation
  const positionSampler = new SampledPositionProperty();
  positionSampler.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: HermitePolynomialApproximation
  });

  // Define the start time for the animation
  const start = JulianDate.fromDate(new Date(2023, 2, 29));

  // Add samples to the position sampler
  for (let i = 0; i < positionData.length; i++) {
    const data = positionData[i];
    const time = JulianDate.addSeconds(start, data.time, new JulianDate());
    const position = Cartesian3.fromDegrees(data.longitude, data.latitude, data.height);
    positionSampler.addSample(time, position);
  }

  // Retrieve the entity by ID and set its position and orientation
  const entity = viewer.entities.getById("54");
  entity.position = positionSampler;
  entity.orientation = new VelocityOrientationProperty(positionSampler); // Orient the model based on movement direction

  // Define the clock parameters for the viewer
  const stop = JulianDate.addSeconds(start, totalDuration, new JulianDate()); // Ensure the stop time matches the total duration

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockRange = ClockRange.CLAMPED; // Ensure the clock stops when reaching the end time
  viewer.clock.multiplier = 1;

  // Set the camera to follow the moving entity
  viewer.trackedEntity = entity;
};

const simulateModelMoving1 = (viewer: Viewer, trajectory: any[]) => {
  const totalDuration = trajectory.length; // Total duration in seconds
  const numPoints = trajectory.length;
  const timeInterval = totalDuration / (numPoints - 1); // Time interval between each point

  const positionData = [];
  for (let i = 0; i < trajectory.length; ++i) {
    positionData.push({
      longitude: Number(trajectory[i].x),
      latitude: Number(trajectory[i].y),
      height: Number(trajectory[i].z),
      time: i * timeInterval // Adjusted time interval
    });
  }

  const positionSampler = new SampledPositionProperty();
  positionSampler.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: HermitePolynomialApproximation
  });

  let start = Cesium.JulianDate.fromDate(new Date());
  for (let i = 0; i < positionData.length; i++) {
    const data = positionData[i];
    const time = JulianDate.addSeconds(start, data.time, new JulianDate());
    const position = Cartesian3.fromDegrees(data.longitude, data.latitude, data.height);
    positionSampler.addSample(time, position);
  }

  const entity = viewer.entities.getById("54");
  if (!entity) {
    console.error("Entity with ID 54 not found");
    return;
  }
  entity.position = positionSampler;
  entity.orientation = new VelocityOrientationProperty(positionSampler);

  const stop = JulianDate.addSeconds(start, totalDuration, new JulianDate());
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockRange = ClockRange.CLAMPED; // Ensure the clock stops when reaching the end time
  viewer.clock.multiplier = 1;
  // 时间轴
  viewer.timeline.zoomTo(start, stop);
  // viewer.trackedEntity = entity;

  viewer.clock.onTick.addEventListener((tick) => {
    if (!wallEntityModel || !entity.position) {
      console.warn("Wall entity or entity position is not available");
      return;
    }


    const entityPosition = viewer.entities.getById('54').position.getValue(tick.currentTime)
    if (!entityPosition) {
      console.warn("Entity position is not available at the current time");
      return;
    }

    const wallPosition = wallEntityModel.position._value;
    if (!wallPosition) {
      console.warn("Wall entity position is not available at the current time");
      return;
    }

    // 检查位置变化
    console.log("currentTime:", tick.currentTime);

    const distance = Cartesian3.distance(entityPosition, wallPosition);
    console.log("Distance between entity and wall:", distance);

    if (distance < 20) {
      wallEntityModel.box.material = new ColorMaterialProperty(
        new CallbackProperty(() => {
          const alpha = 0.5 + 0.5 * Math.sin(viewer.clock.currentTime.secondsOfDay * 2);
          return Color.RED.withAlpha(alpha);
        }, false)
      );
    } else {
      wallEntityModel.box.material = new ColorMaterialProperty(Color.RED.withAlpha(0.5));
    }
  });

};

const simulateModelMoving = (viewer: Viewer, trajectory: any[], dis: number) => {
  const totalDuration = trajectory.length -  1;
  
  // 起始时间
  let start = Cesium.JulianDate.fromDate(new Date());
  // 结束时间
  let stop = Cesium.JulianDate.addSeconds(start, totalDuration, new Cesium.JulianDate());
  // 设置始时钟始时间
  viewer.clock.startTime = start;
  // 设置时钟当前时间
  viewer.clock.currentTime = start.clone();
  // 设置始终停止时间
  viewer.clock.stopTime = stop.clone();
  viewer.clock.shouldAnimate = true; // 开启动画
  // 时间速率，数字越大时间过的越快
  viewer.clock.multiplier = 1;
  // 时间轴
  viewer.timeline.zoomTo(start, stop);

  // 循环执行,即为2，到达终止时间，结束循环
  viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
  // 摄像机聚焦到开始位置
  // viewer.camera.flyTo({
  //   destination: Cesium.Cartesian3.fromDegrees(116.405419, 39.918034, 100000)
  // })
  let property = createProperty(trajectory, start);;
  // 添加entity实体
  let planeModel = viewer.entities.add({
    // 和时间轴关联
    // availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
    //   start: start,
    //   stop: stop
    // })]),
    id: '54',
    position: property,
    // 根据所提供的位置计算模型的朝向
    orientation: new Cesium.VelocityOrientationProperty(property),
    // 模型
    model: {
      uri: 'gltf/diaoche.glb',
      minimumPixelSize: 64, // 您可以尝试减少这个值
      scale: 1.0, // 根据您的需要调整比例尺
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW
      }),
      // leadTime、trailTime 不设置 path全显示
      // leadTime:0,// 设置为0时 模型通过后显示path
      trailTime: 0,// 设置为0时 模型通过后隐藏path
      width: 10
    }
  });

  viewer.clock.onTick.addEventListener((tick) => {
    // let q = viewer.entities.getById('move').orientation.getValue(tick.currentTime)
    // 根据四元素获取方位角heading ,pitch, roll 设置仰角等
    // if (q == undefined) return
    // let hpr = Cesium.HeadingPitchRoll.fromQuaternion(q)
    // let heading = Cesium.Math.toDegrees(hpr.heading);
    // let pitch = Cesium.Math.toDegrees(hpr.pitch);
    // let roll = Cesium.Math.toDegrees(hpr.roll);
    let position = viewer.entities.getById('54').position.getValue(tick.currentTime);
    //世界坐标转换为经纬度
    let ellipsoid = viewer.scene.globe.ellipsoid
    let cartographic = ellipsoid.cartesianToCartographic(position);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let alt = cartographic.height;
    // viewer.scene.camera.setView({
    //   destination: Cartesian3.fromDegrees(lng, lat, 300),
    //   // orientation: {
    //   //   heading, 
    //   //   pitch,    
    //   //   roll                            
    //   // }
    // })
    // let currentTime = viewer.clock.currentTime
    // console.log("currentTime:", tick.currentTime);
    // console.log('position: ', position);

    const wallPosition = wallEntityModel.position._value;
    if (wallPosition) {
      // console.log("Wall center position:", wallPosition);
    } else {
      console.warn("Failed to retrieve wall position");
    }
    const distance = Cartesian3.distance(position, wallPosition);
    console.log("Distance between entity and wall:", distance);

    if (distance < dis) {
      blinkEntity(wallEntityModel, 1000, 250); // 闪烁1秒，频率为500毫秒
    } else {
      wallEntityModel.show = true; // 如果距离大于20米，恢复wallEntityModel的可见性
    }
  })
  viewer.clock.onStop.addEventListener(() => {
    console.log("Animation stopped");
    // 解除相机锁定
    viewer.trackedEntity = null;
  });

};

const blinkEntity = (entity, duration, frequency) => {
  let isVisible = true
  const intervalId = setInterval(() => {
    entity.show = isVisible
    isVisible = !isVisible
  }, frequency)

  setTimeout(() => {
    clearInterval(intervalId)
    entity.show = true //确保实体在闪烁停止后可见
  }, duration)
}

const createProperty = (source, start) => {
  // 取样位置 相当于一个集合
  let property = new Cesium.SampledPositionProperty();
  for (let i = 0; i < source.length; i++) {
    let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate);
    let position = Cesium.Cartesian3.fromDegrees(source[i].x, source[i].y, source[i].z);
    // 添加位置，和时间对应
    property.addSample(time, position);
  }
  return property;
}

//判断点是否在多边形内
const isPointInsideWall = (viewer, wallEntity, point) => {
  if (!wallEntity || !wallEntity.box || !wallEntity.position) {
    console.error("Invalid wall entity");
    return false;
  }

  // 获取围墙中心位置（Cartesian3）
  const wallCenterCartesian = wallEntity.position.getValue(Cesium.JulianDate.now());
  const ellipsoid = viewer.scene.globe.ellipsoid;

  // 转换中心位置到地理坐标
  const wallCenterCartographic = ellipsoid.cartesianToCartographic(wallCenterCartesian);
  const wallLat = Cesium.Math.toDegrees(wallCenterCartographic.latitude);
  const wallLng = Cesium.Math.toDegrees(wallCenterCartographic.longitude);
  const wallHeight = wallCenterCartographic.height;

  // 获取围墙尺寸
  const dimensions = wallEntity.box.dimensions.getValue(Cesium.JulianDate.now());
  const halfWidth = dimensions.x / 2;
  const halfDepth = dimensions.y / 2;

  // 计算围墙四个顶点的经纬度
  const corners = [
    { lat: wallLat + halfDepth / 111320, lng: wallLng - halfWidth / (111320 * Math.cos(Cesium.Math.toRadians(wallLat))) }, // 左上
    { lat: wallLat + halfDepth / 111320, lng: wallLng + halfWidth / (111320 * Math.cos(Cesium.Math.toRadians(wallLat))) }, // 右上
    { lat: wallLat - halfDepth / 111320, lng: wallLng + halfWidth / (111320 * Math.cos(Cesium.Math.toRadians(wallLat))) }, // 右下
    { lat: wallLat - halfDepth / 111320, lng: wallLng - halfWidth / (111320 * Math.cos(Cesium.Math.toRadians(wallLat))) }  // 左下
  ];

  // 判断点是否在围墙多边形内
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    const x = point.lng, y = point.lat;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  return isPointInPolygon(point, corners);
};

onUnmounted(() => {
  if (socket) {
    socket.close()
  }
})
</script>
