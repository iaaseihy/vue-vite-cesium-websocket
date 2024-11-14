/*
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-12 16:41:29
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-14 14:55:31
 */
import { Cesium3DTileset, Matrix3, Matrix4, Transforms, Math, Cartesian3, Entity, ImageMaterialProperty, Color } from 'cesium'
import useCesium from '/@/hooks/useCesium'

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

export function addMovingModel(viewer: ElRef, dis: number) {
	const Cesium = useCesium();
  
	// 确定模型的 URL 路径，假设 FBX 文件已转换为 glTF 格式并存放在 public 目录中
	const modelUrl = `${import.meta.env.BASE_URL}model/diaoche3dtiles/tileset.json`; // 拼接模型路径
	
	// 创建并加载 3D Tiles
	let tileset = new Cesium.Cesium3DTileset({
	  url: modelUrl,
	  // 控制切片视角显示的数量，可调整性能
	  // maximumScreenSpaceError: 2,
	  // maximumNumberOfLoadedTiles: 100000,
	});
  
	// 控制模型的位置
	tileset.readyPromise.then(function (tileset) {
	  // 添加到场景
	  viewer.scene.primitives.add(tileset);
  
	  const longitude = 121.39048943; // 模型需要改变的经度
	  const latitude = 31.0741399; // 模型需要改变的纬度
	  const heightOffset = 18.0; // 模型需要改变的高度
  
	  // 获取 3D Tiles 的 bounds 范围
	  const boundingSphere = tileset.boundingSphere;
	  // 获取 3D Tiles 的范围中心点的弧度
	  const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
	  // 定义 3D Tiles 改变之后中心点的弧度
	  const offsetvalue = Cesium.Cartographic.fromDegrees(longitude, latitude, heightOffset)
  
	  // 模型本身的位置
	  const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
	  // 模型改变的位置
	  const offset = Cesium.Cartesian3.fromRadians(offsetvalue.longitude, offsetvalue.latitude, heightOffset);
  
	  // 定义模型的改变状态
	  const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
	  // 修改模型的位置
	  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  
	  rotate(tileset, 10, 0, 26);
	  scale(tileset, 2, 2, 2);
  
	  // 添加围墙 (2m * 2m 红色围墙)
	  let x = 1;
	  let flog = true;
	  let flashing = false; // 控制是否闪烁
	  const wallEntity = viewer.entities.add({
		name: "矩形区域闪烁",
		position: Cesium.Cartesian3.fromDegrees(121.39024943, 31.0745799, heightOffset + 1),
		box: {
		  dimensions: new Cesium.Cartesian3(2, 2, 3), // 设置围墙为 2m * 2m * 3m
		  material: new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(function () {
			// 只有在距离小于3米时，才使用闪烁效果
			if (flashing) {
			  if (flog) {
				x = x - 0.05;
				if (x <= 0) {
				  flog = false;
				}
			  } else {
				x = x + 0.05;
				if (x >= 1) {
				  flog = true;
				}
			  }
			  return Cesium.Color.RED.withAlpha(x); // 控制透明度，实现闪烁
			} else {
			  return Cesium.Color.RED.withAlpha(0.5); // 距离大于等于 3 米时，不闪烁，保持透明红色
			}
		  }, false))
		}
	  });
  
	  // 监测模型和围墙的距离
	  const wallInterval = setInterval(() => {
		if (tileset) {
		  const modelPosition = tileset.boundingSphere.center;
		  const wallPosition = wallEntity.position.getValue(Cesium.JulianDate.now());
		  
		  const distance = Cesium.Cartesian3.distance(modelPosition, wallPosition);
  
		  // 如果模型与围墙的距离小于3米，启动闪烁
		  if (distance < dis && !flashing) {
			flashing = true; // 启动闪烁
		  }
		  // 如果模型与围墙的距离大于等于3米，停止闪烁
		  else if (distance >= dis && flashing) {
			flashing = false; // 停止闪烁
		  }
		}
	  }, 100); // 每 100 毫秒检查一次
  
	  // 清理定时器
	  return () => {
		if (wallInterval) {
		  clearInterval(wallInterval);
		}
		flashing = false;
	  };
	});
  
	// 将 3D Tiles 加入到场景中
	viewer.scene.primitives.add(tileset);
  
	// 可选：设置视图以适应点云
	tileset.readyPromise.then(() => {
	  viewer.scene.camera.flyToBoundingSphere(tileset.boundingSphere);
	}).catch((error) => {
	  console.error('Failed to load 3D Tiles:', error);
	});
  
	return tileset;
};

/**
 * 启动 WebSocket 监听器
 * @param wsUrl WebSocket 服务器地址
 * @param tileset 3D Tiles 模型
 */
export function startWebSocketListener(socket: WebSocket, tileset: Cesium3DTileset) {
  const Cesium = useCesium();

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 假设 WebSocket 数据包含 `longitude`, `latitude`, `height` 字段
    const { longitude, latitude, height } = data;

    // 使用模型当前的位置，计算新的平移矩阵
    const offset = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

    // 获取原位置并计算新的平移向量
    const origin = tileset.boundingSphere.center;
    const translation = Cesium.Cartesian3.subtract(offset, origin, new Cesium.Cartesian3());

    // 更新模型的位置矩阵，应用平移和高度偏移
    const translationMatrix = Cesium.Matrix4.fromTranslation(translation);
    tileset.modelMatrix = Cesium.Matrix4.multiply(translationMatrix, tileset.modelMatrix, new Cesium.Matrix4());
  };

  socket.onclose = () => {
    console.log('WebSocket closed.');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
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