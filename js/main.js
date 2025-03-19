// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const chatContainer = document.getElementById('chatContainer');
    const chartContainer = document.getElementById('chartContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const statusElement = document.getElementById('status');
    const moodSelector = document.getElementById('moodSelector');
    const moodOptions = document.querySelectorAll('.mood-option');
    const chatViewBtn = document.getElementById('chatViewBtn');
    const chartViewBtn = document.getElementById('chartViewBtn');
    
    // 当前选择的心情
    let currentMood = 'neutral';
    
    // 消息历史记录数组
    let messageHistory = [
        {role: "system", content: "你是一位专业的生活教练AI助手，你的目标是通过对话帮助用户成长，提供有价值的建议和指导。你应该积极倾听，提出有见地的问题，并给出实用的建议。保持友好、支持性的语气，避免说教。"}
    ];
    
    // 初始化页面
    init();
    
    /**
     * 初始化页面和事件监听
     */
    function init() {
        // 发送按钮点击事件
        sendButton.addEventListener('click', handleUserMessage);
        
        // 输入框回车事件
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserMessage();
            }
        });
        
        // 心情选择事件
        moodOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除之前选中的心情
                moodOptions.forEach(opt => opt.classList.remove('selected'));
                // 添加当前选中的心情
                option.classList.add('selected');
                // 更新当前心情
                currentMood = option.getAttribute('data-mood');
            });
        });
        
        // 默认选中平静心情
        document.querySelector('[data-mood="neutral"]').classList.add('selected');
        
        // 视图切换事件
        chatViewBtn.addEventListener('click', () => {
            chatViewBtn.classList.add('active');
            chartViewBtn.classList.remove('active');
            chatContainer.style.display = 'block';
            chartContainer.style.display = 'none';
        });
        
        chartViewBtn.addEventListener('click', () => {
            chartViewBtn.classList.add('active');
            chatViewBtn.classList.remove('active');
            chartContainer.style.display = 'block';
            chatContainer.style.display = 'none';
            renderMoodChart('week'); // 默认显示一周的数据
        });
        
        // 图表周期选择事件
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderMoodChart(btn.getAttribute('data-period'));
            });
        });
        
        // 自动聚焦到输入框
        userInput.focus();
    }
    
    /**
     * 处理用户发送的消息
     */
    function handleUserMessage() {
        const message = userInput.value.trim();
        
        // 检查消息是否为空
        if (message === '') return;
        
        // 添加用户消息到聊天区域
        addMessageToChat('user', message);
        
        // 清空输入框
        userInput.value = '';
        
        // 添加用户消息和心情到历史记录
        messageHistory.push({role: "user", content: `[心情:${currentMood}] ${message}`});
        
        // 保存心情数据
        saveMoodData(currentMood);
        
        // 显示AI正在输入状态
        showTypingIndicator();
        
        // 禁用发送按钮
        toggleInputState(true);
        
        // 发送请求到服务器
        sendToServer(messageHistory);
    }
    
    /**
     * 保存心情数据到localStorage
     * @param {string} mood - 心情类型
     */
    function saveMoodData(mood) {
        // 获取当前时间
        const timestamp = new Date().toISOString();
        
        // 从localStorage获取现有数据
        let moodData = JSON.parse(localStorage.getItem('moodData')) || [];
        
        // 添加新的心情数据
        moodData.push({
            mood: mood,
            timestamp: timestamp
        });
        
        // 保存回localStorage
        localStorage.setItem('moodData', JSON.stringify(moodData));
    }
    
    /**
     * 渲染心情趋势图表
     * @param {string} period - 时间周期（'week', 'month', 'all'）
     */
    function renderMoodChart(period) {
        // 从localStorage获取心情数据
        const moodData = JSON.parse(localStorage.getItem('moodData')) || [];
        
        if (moodData.length === 0) {
            // 如果没有数据，显示提示信息
            document.getElementById('moodChart').style.display = 'none';
            document.querySelector('.chart-info').textContent = '暂无心情数据。当你开始与AI交流并选择心情时，这里将显示你的情绪变化趋势。';
            return;
        }
        
        // 根据选择的时间周期筛选数据
        const filteredData = filterDataByPeriod(moodData, period);
        
        // 准备图表数据
        const chartData = prepareChartData(filteredData);
        
        // 获取canvas元素
        const ctx = document.getElementById('moodChart').getContext('2d');
        
        // 销毁现有图表（如果有）
        if (window.moodChartInstance) {
            window.moodChartInstance.destroy();
        }
        
        // 创建新图表
        window.moodChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '情绪指数',
                    data: chartData.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                    pointRadius: 4,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                if (value === 0) return '消极';
                                if (value === 50) return '中性';
                                if (value === 100) return '积极';
                                return '';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const moodValue = context.raw;
                                let moodLabel = '中性';
                                
                                if (moodValue < 30) moodLabel = '消极';
                                else if (moodValue < 40) moodLabel = '焦虑';
                                else if (moodValue < 50) moodLabel = '难过';
                                else if (moodValue > 70) moodLabel = '开心';
                                else if (moodValue > 50) moodLabel = '平静';
                                
                                return `情绪: ${moodLabel} (${moodValue})`;
                            }
                        }
                    }
                }
            }
        });
        
        // 显示图表
        document.getElementById('moodChart').style.display = 'block';
        document.querySelector('.chart-info').textContent = '图表显示了你在不同时间的情绪变化，帮助你了解自己的情绪模式。';
    }
    
    /**
     * 根据时间周期筛选数据
     * @param {Array} data - 心情数据数组
     * @param {string} period - 时间周期
     * @returns {Array} - 筛选后的数据
     */
    function filterDataByPeriod(data, period) {
        const now = new Date();
        let cutoffDate;
        
        if (period === 'week') {
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 一周前
        } else if (period === 'month') {
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 一个月前
        } else {
            return data; // 'all' 返回所有数据
        }
        
        return data.filter(item => new Date(item.timestamp) >= cutoffDate);
    }
    
    /**
     * 准备图表数据
     * @param {Array} data - 心情数据数组
     * @returns {Object} - 图表数据对象
     */
    function prepareChartData(data) {
        // 将数据按时间排序
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // 准备标签和值数组
        const labels = [];
        const values = [];
        
        // 心情映射到数值
        const moodValueMap = {
            'happy': 80,    // 开心
            'neutral': 60,  // 平静
            'anxious': 40,  // 焦虑
            'sad': 30,      // 难过
            'angry': 20     // 生气
        };
        
        // 处理每个数据点
        data.forEach(item => {
            // 格式化日期为更友好的显示
            const date = new Date(item.timestamp);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            labels.push(formattedDate);
            values.push(moodValueMap[item.mood] || 50); // 默认为50（中性）
        });
        
        return { labels, values };
    }
    
    /**
     * 添加消息到聊天区域
     * @param {string} role - 消息发送者角色（'user'或'ai'）
     * @param {string} content - 消息内容
     */
    function addMessageToChat(role, content) {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // 创建消息内容元素
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        // 将内容添加到消息元素
        messageDiv.appendChild(contentDiv);
        
        // 将消息添加到聊天容器
        chatContainer.appendChild(messageDiv);
        
        // 滚动到最新消息
        scrollToBottom();
    }
    
    /**
     * 显示AI正在输入的指示器
     */
    function showTypingIndicator() {
        statusElement.innerHTML = 'AI正在思考 <div class="typing-indicator"><span></span><span></span><span></span></div>';
    }
    
    /**
     * 隐藏AI正在输入的指示器
     */
    function hideTypingIndicator() {
        statusElement.innerHTML = '';
    }
    
    /**
     * 切换输入状态（启用/禁用）
     * @param {boolean} disabled - 是否禁用输入
     */
    function toggleInputState(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }
    
    /**
     * 滚动聊天区域到底部
     */
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    /**
     * 发送消息历史到服务器
     * @param {Array} messages - 消息历史数组
     */
    function sendToServer(messages) {
        // 使用完整的服务器地址
        fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应异常');
            }
            
            // 获取响应的可读流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';
            let aiMessageElement = null;
            
            // 处理流式响应
            function processStream({ done, value }) {
                if (done) {
                    // 流结束，隐藏输入指示器并启用输入
                    hideTypingIndicator();
                    toggleInputState(false);
                    
                    // 将AI回复添加到历史记录
                    messageHistory.push({role: "assistant", content: aiResponse});
                    return;
                }
                
                // 解码接收到的数据
                const chunk = decoder.decode(value, { stream: true });
                
                // 如果是第一个数据块，创建新的AI消息元素
                if (!aiMessageElement) {
                    aiMessageElement = document.createElement('div');
                    aiMessageElement.className = 'message ai-message';
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    aiMessageElement.appendChild(contentDiv);
                    
                    chatContainer.appendChild(aiMessageElement);
                }
                
                // 更新AI回复内容
                aiResponse += chunk;
                aiMessageElement.querySelector('.message-content').textContent = aiResponse;
                
                // 滚动到最新消息
                scrollToBottom();
                
                // 继续读取流
                return reader.read().then(processStream);
            }
            
            // 开始读取流
            return reader.read().then(processStream);
        })
        .catch(error => {
            console.error('请求错误:', error);
            let errorMessage = '抱歉，我遇到了一些问题，无法回应你的消息。请稍后再试。';
            
            // 检查是否是API认证错误
            if (error.response && error.response.status === 401) {
                errorMessage = '抱歉，API认证失败。请联系管理员检查API密钥配置。';
                console.error('API认证错误:', error.response.data);
            } else if (error.request && !error.response) {
                errorMessage = '无法连接到服务器，请检查网络连接或服务器状态。';
            }
            
            addMessageToChat('ai', errorMessage);
            hideTypingIndicator();
            toggleInputState(false);
        });
    }
});