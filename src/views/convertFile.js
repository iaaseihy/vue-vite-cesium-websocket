export const convertTxtToJson = async (file) => {
    // 创建 FileReader 对象
    const reader = new FileReader();
  
    // Promise 以等待文件读取完成
    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const content = event.target.result; // 获取文件内容
        const lines = content.trim().split('\n'); // 按行分割
        const result = [];
  
        lines.forEach((line, index) => {
          try {
            // 解析 JSON 格式的字符串
            const data = JSON.parse(line.trim());
  
            // 提取字段并推入结果数组
            result.push({
              z: data.z,
              y: data.x, // 注意原 JSON 格式中 y 和 x 的名称与常规的不同
              x: data.y,
              deviceId: data.deviceId,
              time: index, // 根据行数计算时间
            });
          } catch (error) {
            console.error(`解析错误：${line}`, error);
          }
        });
  
        resolve(result); // 返回转换后的 JSON 数据
      };
  
      reader.onerror = (error) => {
        reject(error); // 错误处理
      };
  
      reader.readAsText(file); // 读取文件为文本内容
    });
  };
  