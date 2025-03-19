// 测试DeepSeek API连接
const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

console.log('API密钥是否存在:', !!DEEPSEEK_API_KEY);
console.log('使用API URL:', DEEPSEEK_API_URL);

async function testAPI() {
  try {
    const response = await axios({
      method: 'post',
      url: DEEPSEEK_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      data: {
        model: 'deepseek-r1-250120',
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.6
      },
      timeout: 10000 // 10秒超时
    });
    
    console.log('API连接成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
  } catch (error) {
    console.error('API连接错误:');
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('没有收到响应，可能是网络问题或API端点不可用');
    } else {
      // 设置请求时发生错误
      console.error('请求错误:', error.message);
    }
  }
}

testAPI();