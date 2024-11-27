<!--
 * @Descripttion: 
 * @version: v1.0
 * @Author: CaoChaoqiang
 * @Date: 2024-11-27 09:55:04
 * @LastEditors: CaoChaoqiang
 * @LastEditTime: 2024-11-27 09:55:11
-->
<template>
    <div>
      <h3>上传并解析 HHHT.txt 文件</h3>
      <input type="file" @change="handleFileUpload" />
      <pre v-if="jsonData">{{ jsonData }}</pre>
      <button v-if="jsonData" @click="downloadJson">下载 JSON</button>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { convertTxtToJson } from './convertFile'; // 引入工具模块
  
  export default {
    setup() {
      const jsonData = ref(null);
  
      const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            jsonData.value = await convertTxtToJson(file); // 解析文件内容
            console.log('转换后的数据:', jsonData.value);
          } catch (error) {
            console.error('文件解析失败:', error);
          }
        }
      };
  
      const downloadJson = () => {
        const blob = new Blob([JSON.stringify(jsonData.value, null, 2)], {
          type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'hhht.json';
        link.click();
      };
  
      return {
        handleFileUpload,
        jsonData,
        downloadJson,
      };
    },
  };
  </script>
  
  <style scoped>
  h3 {
    font-size: 1.5rem;
  }
  pre {
    background: #f4f4f4;
    padding: 1rem;
    border-radius: 4px;
    overflow: auto;
  }
  </style>
  