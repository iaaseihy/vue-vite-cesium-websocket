/*
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-12 16:41:29
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-15 16:05:15
 */
import { Cesium3DTileset, Matrix3, Matrix4, Transforms, Math, Cartesian3, Entity, ImageMaterialProperty, Color, ColorMaterialProperty, JulianDate, Viewer } from 'cesium'
import useCesium from '/@/hooks/useCesium'
import * as Cesium from 'cesium'

export default function useSetOSMBuildings(viewer: ElRef) {
  const Cesium = useCesium()
  viewer.imageryLayers.addImageryProvider(new Cesium.IonImageryProvider({ assetId: 3 }))

  viewer.scene.primitives.add(Cesium.createOsmBuildings())

  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.019, 40.6912, 750),
    orientation: {
      heading: Cesium.Math.toRadians(20),
      pitch: Cesium.Math.toRadians(-20),
    },
  })
}

let tilesetUrl = `${import.meta.env.BASE_URL}model/pointcloud3dtiles/tileset.json`;
export function addPointCloud3Dtiles(viewer: ElRef) {
  const Cesium = useCesium()
  // 创建并加载 3D Tiles
  const tileset = new Cesium.Cesium3DTileset({
    url: tilesetUrl,
	// 官方沙盒模型
	// url: Cesium.IonResource.fromAssetId(16421),
  });
  
  // 设置 3D Tiles 的最大屏幕空间误差为 0，以获得最佳精度
  tileset.maximumScreenSpaceError = 0; // 设置屏幕空间误差上限为 0
  // 将 3D Tiles 加入到场景中
  viewer.scene.primitives.add(tileset);

  // 可选：设置视图以适应点云
  tileset.readyPromise.then(() => {
    viewer.scene.camera.flyToBoundingSphere(tileset.boundingSphere);
  }).catch((error) => {
    console.error('Failed to load 3D Tiles:', error);
  });
}

// 添加多个模型
export function addMovingModels(viewer: ElRef, models: { id: number, url: string }[], dis: number) {
	const Cesium = useCesium()
  
	models.forEach(model => {
	  const tileset = new Cesium.Cesium3DTileset({
		url: model.url
	  })
  
	  viewer.scene.primitives.add(tileset)
  
	  tileset.readyPromise.then(() => {
		const longitude = 121.39048943
		const latitude = 31.0741399
		const heightOffset = 18.0
  
		const boundingSphere = tileset.boundingSphere
		const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center)
		const offsetvalue = Cesium.Cartographic.fromDegrees(longitude, latitude, heightOffset)
  
		const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0)
		const offset = Cesium.Cartesian3.fromRadians(offsetvalue.longitude, offsetvalue.latitude, heightOffset)
  
		const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3())
		tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
		rotate(tileset, 10, 0, 26);
		scale(tileset, 2, 2, 2);
		// 添加围墙 (2m * 2m 红色围墙)
		addWallEffect(viewer, tileset, dis);
	  })
	})
}

/**
 * 启动 WebSocket 监听器
 * @param wsUrl WebSocket 服务器地址
 * @param tileset 3D Tiles 模型
 */
export function startWebSocketListener(socket: WebSocket) {
	socket.onmessage = (event) => {
	  const data = JSON.parse(event.data);
	  console.log('Received WebSocket data:', data);
	};
  }

  // WebSocket监听
function startWebSocketListenerForModel(tileset: Cesium3DTileset, modelId: number, dis: number) {
	const socket = new WebSocket('ws://localhost:8080/ws');
	const Cesium = useCesium();
  
	socket.onmessage = (event) => {
	  const data = JSON.parse(event.data);
  
	  const { longitude, latitude, height, id } = data;
  
	  if (id === modelId) {
		const offset = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
		const origin = tileset.boundingSphere.center;
		const translation = Cesium.Cartesian3.subtract(offset, origin, new Cesium.Cartesian3());
  
		const translationMatrix = Cesium.Matrix4.fromTranslation(translation);
		tileset.modelMatrix = Cesium.Matrix4.multiply(translationMatrix, tileset.modelMatrix, new Cesium.Matrix4());
  
		updateWallFlashingEffect(tileset, dis);
	  }
	};
  
	socket.onclose = () => {
	  console.log(`WebSocket for model ${modelId} closed.`);
	};
  
	socket.onerror = (error) => {
	  console.error('WebSocket error:', error);
	};
  }

 // 定义全局的透明度变化状态
let x = 1;  // 透明度初始值
let flog = true;  // 控制透明度增减
let flashing = false;  // 控制是否闪烁

// 在外部定义 wallEntity 变量
export let wallEntity: Cesium.Entity | null = null;

// 用于创建围墙并保存 wallEntity 引用
export function addWallEffect(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset, dis: number) {
	// 创建围墙并保存实体引用
	wallEntity = viewer.entities.add({
	  name: "围墙",
	  position: Cesium.Cartesian3.fromDegrees(121.390179, 31.074584, 19),
	  box: {
		dimensions: new Cesium.Cartesian3(2, 2, 3),
		material: new Cesium.ColorMaterialProperty(Cesium.Color.RED.withAlpha(0.5)),
	  }
	});
  
	// 定时器每隔一定时间检查与模型的距离
	// const wallInterval = setInterval(() => {
	//   if (wallEntity) {
	// 	updateWallFlashingEffect(tileset, wallEntity, dis);
	//   }
	// }, 200); // 每200ms检查一次
  
	// 清理定时器
	// return () => {
	//   clearInterval(wallInterval);
	// };
  }

// 更新围墙闪烁效果
export function updateWallFlashingEffect(tileset: Cesium.Cesium3DTileset, wallEntity: Cesium.Entity, dis: number) {
	const modelPosition = tileset.boundingSphere.center;
	console.log('Model Position:', modelPosition);
	
	const wallPosition = wallEntity.position.getValue(Cesium.JulianDate.now());
	console.log('Wall Position:', wallPosition);  // 检查位置
	
	if (!wallPosition) {
	  console.warn("Wall entity position is not available");
	  return;
	}
  
	// 计算模型与围墙的距离
	const distance = Cesium.Cartesian3.distance(modelPosition, wallPosition);
	console.log('Distance:', distance);  // 检查距离值
	
	// 如果模型与围墙的距离小于阈值，启动闪烁效果
	if (distance < dis && !flashing) {
	  flashing = true; // 启动闪烁
	  console.log("Flashing started");
	} 
	// 如果模型与围墙的距离大于等于阈值，停止闪烁
	else if (distance >= dis && flashing) {
	  flashing = false; // 停止闪烁
	  console.log("Flashing stopped");
	}
  
	// 更新围墙材质的闪烁效果
	wallEntity.box.material = new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(() => {
	  if (flashing) {
		if (flog) {
		  x = x - 0.005; // 透明度递减
		  if (x <= 0) {
			flog = false; // 透明度降到0时，开始增大透明度
		  }
		} else {
		  x = x + 0.005; // 透明度递增
		  if (x >= 1) {
			flog = true; // 透明度增到1时，开始减小透明度
		  }
		}
		return Cesium.Color.RED.withAlpha(x); // 返回带透明度的颜色
	  } else {
		return Cesium.Color.RED.withAlpha(0.5); // 当不闪烁时，围墙为固定红色透明
	  }
	}, false));
  }
  
  
  
/**基于本地的ENU坐标系的旋转，也就是垂直于地表向上为Z，东为X，北为Y
 * @param tileset Cesium3DTileset
 * @param rx 绕X轴旋转的角度。单位：度
 * @param ry 绕Y轴旋转的角度。单位：度
 * @param rz 绕Z轴旋转的角度。单位：度
 */
function rotate(tileset: Cesium3DTileset, rx: number, ry: number, rz: number) {
	if (rx === 0 && ry === 0 && rz === 0) return
	// 获取中心点。
	const origin = tileset.boundingSphere.center
	// 以该点建立ENU坐标系
	const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin)
	// 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
	const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4())
	// 计算旋转矩阵
	const rotateMatrix = Matrix4.clone(Matrix4.IDENTITY)
	if (rx !== 0) {
		const rotateXMatrix = Matrix4.fromRotation(Matrix3.fromRotationX(Math.toRadians(rx)))
		Matrix4.multiply(rotateXMatrix, rotateMatrix, rotateMatrix)
	}
	if (ry !== 0) {
		const rotateYMatrix = Matrix4.fromRotation(Matrix3.fromRotationY(Math.toRadians(ry)))
		Matrix4.multiply(rotateYMatrix, rotateMatrix, rotateMatrix)
	}
	if (rz !== 0) {
		const rotateZMatrix = Matrix4.fromRotation(Matrix3.fromRotationZ(Math.toRadians(rz)))
		Matrix4.multiply(rotateZMatrix, rotateMatrix, rotateMatrix)
	}
	// ENU坐标系下的结果矩阵
	const localResultMatrix = Matrix4.multiply(rotateMatrix, toLocalMatrix, new Matrix4())
	// 世界坐标系下的结果矩阵
	const worldResultMatrix = Matrix4.multiply(toWorldMatrix, localResultMatrix, new Matrix4())
	// 应用结果
	tileset.modelMatrix = Matrix4.multiply(worldResultMatrix, tileset.modelMatrix, new Matrix4())
}

/**基于本地的ENU坐标系的缩放，也就是垂直于地表向上为Z，东为X，北为Y
 * @param tileset Cesium3DTileset
 * @param sx x轴缩放倍数
 * @param sy y轴缩放倍数
 * @param sz z轴缩放倍数
 */
function scale(tileset: Cesium3DTileset, sx: number, sy: number, sz: number) {
	if (sx <= 0 || sy <= 0 || sz <= 0) throw Error('缩放倍数必须大于0')
	if (sx === 1 && sy === 1 && sz === 1) return
	// 具体步骤是将3DTileset先转为ENU坐标系，再在ENU坐标系下计算缩放后的结果，再转回世界坐标系。一个步骤代表一个矩阵
	// 获取中心点。
	const origin = tileset.boundingSphere.center
	// 以该点建立ENU坐标系
	const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin)
	// 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
	const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4())
	// 计算缩放矩阵
	const scaleMatrix = Matrix4.fromScale(new Cartesian3(sx, sy, sz))
	// ENU坐标系下的结果矩阵
	const localResultMatrix = Matrix4.multiply(scaleMatrix, toLocalMatrix, new Matrix4())
	// 世界坐标系下的结果矩阵
	const worldResultMatrix = Matrix4.multiply(toWorldMatrix, localResultMatrix, new Matrix4())
	// 应用结果
	tileset.modelMatrix = Matrix4.multiply(worldResultMatrix, tileset.modelMatrix, new Matrix4())
}

/**基于本地的ENU坐标系的偏移，也就是垂直于地表向上为Z，东为X，北为Y
 * @param tileset Cesium3DTileset
 * @param dx x轴偏移量。单位：米
 * @param dy y轴偏移量。单位：米
 * @param dz z轴偏移量。单位：米
 */
function translate(tileset: Cesium3DTileset, dx: number, dy: number, dz: number) {
	if (dx === 0 && dy === 0 && dz === 0) return
	// 对于3DTileset，我们需要的结果是一个模型矩阵，那么平移就是计算一个世界坐标下的平移矩阵。
	// 获取中心点
	const origin = tileset.boundingSphere.center
	// 以该点建立ENU坐标系
	const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin)
	// 该坐标系下平移后的位置
	const translatePosition = new Cartesian3(dx, dy, dz)
	// 获取平移后位置的世界坐标
	const worldPosition = Matrix4.multiplyByPoint(toWorldMatrix, translatePosition, new Cartesian3())
	// 计算世界坐标下的各个平移量
	const offset = Cartesian3.subtract(worldPosition, origin, new Cartesian3())
	// 从世界坐标下的平移量计算世界坐标的平移矩阵
	const translateMatrix = Matrix4.fromTranslation(offset)
	// 应用平移矩阵。这里应该与原本的模型矩阵点乘，而不是直接赋值
	tileset.modelMatrix = Matrix4.multiply(translateMatrix, tileset.modelMatrix, new Matrix4())
}