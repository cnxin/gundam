/**
 * 高达模型数据管理模块
 * 使用GitHub Gist存储数据
 */
const GundamDB = {
    // 从配置文件获取敏感信息
    get GIST_ID() {
        return CONFIG.GIST_ID;
    },
    
    get GITHUB_TOKEN() {
        return CONFIG.GITHUB_TOKEN;
    },
    
    GIST_FILENAME: 'gundam_models.json',
    
    // 本地缓存键名
    CACHE_KEY: 'gundam_models_cache',
    CACHE_TIMESTAMP: 'gundam_cache_timestamp',
    
    // 检查配置是否存在
    checkConfig() {
        if (typeof CONFIG === 'undefined') {
            throw new Error('配置文件未加载，请确保已创建 config.js 文件');
        }
        if (!this.GIST_ID || !this.GITHUB_TOKEN) {
            throw new Error('配置文件中缺少必要的配置项');
        }
    },
    
    // 错误处理中间件
    async withErrorHandling(operation, fallback = null) {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            console.error('操作失败:', error);
            // 如果是配置错误，显示特定消息
            if (error.message.includes('配置文件')) {
                alert('请检查配置文件是否正确设置');
            } else {
                alert('操作失败，请稍后重试');
            }
            return fallback;
        }
    },
    
    // 获取所有高达模型数据
    async getAllModels() {
        return this.withErrorHandling(async () => {
            this.checkConfig();
            const cachedData = this.getFromCache();
            if (cachedData) {
                return cachedData;
            }
            
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`);
            if (!response.ok) {
                throw new Error(`获取数据失败: ${response.status}`);
            }
            
            const gistData = await response.json();
            const fileContent = gistData.files[this.GIST_FILENAME].content;
            const models = JSON.parse(fileContent);
            
            this.updateCache(models);
            return models;
        }, []);  // 失败时返回空数组
    },
    
    // 获取单个高达模型数据
    async getModel(id) {
        const models = await this.getAllModels();
        return models.find(model => model.id === id);
    },
    
    // 添加高达模型
    async addModel(model) {
        // 生成唯一ID
        model.id = Date.now().toString();
        
        // 获取现有模型
        const models = await this.getAllModels();
        models.push(model);
        
        // 更新Gist
        await this.updateGist(models);
        
        // 更新缓存
        this.updateCache(models);
        
        return model;
    },
    
    // 更新高达模型
    async updateModel(id, updatedModel) {
        const models = await this.getAllModels();
        const index = models.findIndex(model => model.id === id);
        
        if (index === -1) return false;
        
        // 保持原有ID
        updatedModel.id = id;
        
        // 更新模型
        models[index] = updatedModel;
        
        // 更新Gist
        await this.updateGist(models);
        
        // 更新缓存
        this.updateCache(models);
        
        return true;
    },
    
    // 删除高达模型
    async deleteModel(id) {
        const models = await this.getAllModels();
        const filteredModels = models.filter(model => model.id !== id);
        
        if (filteredModels.length === models.length) return false;
        
        // 更新Gist
        await this.updateGist(filteredModels);
        
        // 更新缓存
        this.updateCache(filteredModels);
        
        return true;
    },
    
    // 更新Gist
    async updateGist(models) {
        this.checkConfig();
        try {
            const response = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'Authorization': `token ${this.GITHUB_TOKEN}`
                },
                body: JSON.stringify({
                    files: {
                        [this.GIST_FILENAME]: {
                            content: JSON.stringify(models, null, 2)
                        }
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`更新Gist失败: ${errorData.message}`);
            }
            
            return true;
        } catch (error) {
            console.error('更新Gist失败:', error);
            alert('更新数据失败，请稍后再试');
            throw error;
        }
    },
    
    // 搜索高达模型
    async searchModels(query) {
        if (!query) return this.getAllModels();
        
        const models = await this.getAllModels();
        const lowerQuery = query.toLowerCase();
        
        return models.filter(model => 
            model.model.toLowerCase().includes(lowerQuery) ||
            this.searchInParts(model.parts, lowerQuery)
        );
    },
    
    // 在部件中搜索
    searchInParts(parts, query) {
        if (!parts) return false;
        
        for (const mainPart of parts) {
            if (mainPart.name.toLowerCase().includes(query)) return true;
            
            if (mainPart.subParts) {
                for (const subPart of mainPart.subParts) {
                    if (subPart.name.toLowerCase().includes(query)) return true;
                    
                    if (subPart.components) {
                        for (const component of subPart.components) {
                            if (component.toLowerCase().includes(query)) return true;
                        }
                    }
                }
            }
        }
        
        return false;
    },
    
    // 导入数据
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!Array.isArray(data)) {
                throw new Error('数据格式错误，应为数组');
            }
            
            // 获取现有模型
            const existingModels = await this.getAllModels();
            
            // 合并数据
            const newModels = [...existingModels];
            
            // 添加新模型
            for (const model of data) {
                if (!model.model) {
                    throw new Error('模型缺少型号信息');
                }
                
                // 确保每个模型有唯一ID
                if (!model.id) {
                    model.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                }
                
                // 检查是否已存在相同ID的模型
                const existingIndex = newModels.findIndex(m => m.id === model.id);
                if (existingIndex >= 0) {
                    // 更新现有模型
                    newModels[existingIndex] = model;
                } else {
                    // 添加新模型
                    newModels.push(model);
                }
            }
            
            // 更新Gist
            await this.updateGist(newModels);
            
            // 更新缓存
            this.updateCache(newModels);
            
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    },
    
    // 导出数据
    async exportData() {
        const models = await this.getAllModels();
        return JSON.stringify(models, null, 2);
    },
    
    // 获取所有板件列表
    async getAllRunners(gundamId) {
        const gundam = await this.getModel(gundamId);
        if (!gundam || !gundam.parts) return [];
        
        const runners = new Map();
        
        // 遍历所有部件，收集板件信息
        gundam.parts.forEach(mainPart => {
            if (mainPart.subParts) {
                mainPart.subParts.forEach(subPart => {
                    if (subPart.components) {
                        subPart.components.forEach(component => {
                            // 尝试多种格式匹配
                            // 1. 标准格式: "A: 1、2、3" 或 "A1: 1~5"
                            let match = component.match(/^([A-Z][0-9]*)[\s]*[:：][\s]*(.+)$/i);
                            
                            // 2. 如果没有匹配到标准格式，尝试直接提取字母部分作为板件ID
                            if (!match) {
                                match = component.match(/^([A-Z][0-9]*)/i);
                                if (match) {
                                    // 提取数字部分作为号码
                                    const runnerId = match[1];
                                    const numbers = component.substring(match[0].length).trim();
                                    // 只有当numbers不为空时才添加
                                    if (numbers) {
                                        match = [component, runnerId, numbers];
                                    } else {
                                        match = null;
                                    }
                                }
                            }
                            
                            // 3. 如果仍然没有匹配，将整个组件视为号码，使用默认板件ID
                            if (!match && component.trim()) {
                                match = [component, 'A', component.trim()];
                            }
                            
                            if (match) {
                                const runnerId = match[1].trim();
                                const parts = match[2].trim();
                                
                                if (!runners.has(runnerId)) {
                                    runners.set(runnerId, {
                                        id: runnerId,
                                        parts: []
                                    });
                                }
                                
                                runners.get(runnerId).parts.push({
                                    mainPart: mainPart.name,
                                    subPart: subPart.name,
                                    numbers: parts
                                });
                            }
                        });
                    }
                });
            }
        });
        
        // 转换为数组并排序
        return Array.from(runners.values()).sort((a, b) => {
            // 按照板件ID排序（先字母后数字）
            const aMatch = a.id.match(/^([A-Z]+)(\d*)$/i);
            const bMatch = b.id.match(/^([A-Z]+)(\d*)$/i);
            
            if (aMatch && bMatch) {
                if (aMatch[1] !== bMatch[1]) {
                    return aMatch[1].localeCompare(bMatch[1]);
                }
                return parseInt(aMatch[2] || 0) - parseInt(bMatch[2] || 0);
            }
            return a.id.localeCompare(b.id);
        });
    },
    
    // 缓存管理
    getFromCache() {
        try {
            const timestamp = localStorage.getItem(this.CACHE_TIMESTAMP);
            const now = new Date().getTime();
            
            // 缓存有效期为5分钟
            if (timestamp && now - parseInt(timestamp) < 300000) {
                const data = localStorage.getItem(this.CACHE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    // 验证数据格式
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                }
            }
        } catch (error) {
            console.error('读取缓存失败:', error);
            // 清除可能损坏的缓存
            this.clearCache();
        }
        return null;
    },
    
    updateCache(models) {
        try {
            if (!Array.isArray(models)) {
                throw new Error('缓存数据必须是数组');
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(models));
            localStorage.setItem(this.CACHE_TIMESTAMP, new Date().getTime().toString());
        } catch (error) {
            console.error('更新缓存失败:', error);
            // 出错时清除缓存
            this.clearCache();
        }
    },
    
    clearCache() {
        try {
            localStorage.removeItem(this.CACHE_KEY);
            localStorage.removeItem(this.CACHE_TIMESTAMP);
        } catch (error) {
            console.error('清除缓存失败:', error);
        }
    },
    
    // 初始化函数
    async init() {
        try {
            // 检查配置
            this.checkConfig();
            
            // 尝试从Gist获取初始数据
            const models = await this.getAllModels();
            
            // 更新缓存
            if (Array.isArray(models)) {
                this.updateCache(models);
            }
            
            return true;
        } catch (error) {
            console.error('初始化失败:', error);
            return false;
        }
    }
}; 