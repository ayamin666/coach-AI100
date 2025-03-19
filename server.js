// 引入所需模块
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// 创建Express应用
const app = express();
const PORT = 3000;

// 配置中间件
app.use(cors()); // 启用CORS，解决跨域问题
app.use(express.json()); // 解析JSON请求体
app.use(express.static('.')); // 提供静态文件服务

// DeepSeek R1 API配置
// 从环境变量中读取API密钥和URL
require('dotenv').config();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

// 添加调试日志
console.log('使用API URL:', DEEPSEEK_API_URL);
console.log('API密钥是否存在:', !!DEEPSEEK_API_KEY);

// 处理聊天请求的路由
app.post('/chat', async (req, res) => {
    try {
        // 检查API密钥是否存在
        if (!DEEPSEEK_API_KEY) {
            console.error('DeepSeek API密钥未设置');
            return res.status(500).send('DeepSeek API密钥未设置，请检查环境变量配置');
        }
        
        // 获取请求中的消息历史
        const { messages } = req.body;
        
        // 设置响应头，启用流式输出
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // 创建API请求配置
        const config = {
            method: 'post',
            url: DEEPSEEK_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            data: {
                model: 'deepseek-r1-250120',
                messages: messages,
                temperature: 0.6,
                stream: true // 启用流式输出
            },
            responseType: 'stream',
            timeout: 60000 // 设置超时为60秒
        };
        
        // 发送请求到DeepSeek API
        const response = await axios(config);
        
        // 将API响应流式传输到客户端
        response.data.on('data', (chunk) => {
            try {
                // 解析数据块
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    // 跳过data: [DONE]行
                    if (line.includes('[DONE]')) continue;
                    
                    // 从data:前缀中提取JSON
                    const jsonStr = line.replace(/^data: /, '');
                    const data = JSON.parse(jsonStr);
                    
                    // 提取内容并发送到客户端
                    if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                        const content = data.choices[0].delta.content;
                        res.write(content);
                    }
                }
            } catch (error) {
                console.error('解析流数据错误:', error);
                // 继续处理，不中断流
            }
        });
        
        // 处理API响应结束
        response.data.on('end', () => {
            res.end();
        });
        
        // 处理API响应错误
        response.data.on('error', (err) => {
            console.error('API响应流错误:', err);
            res.status(500).end('服务器内部错误');
        });
        
    } catch (error) {
        console.error('处理请求错误:', error);
        res.status(500).send('服务器内部错误');
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('使用Ctrl+C停止服务器');
});