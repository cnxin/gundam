/**
 * 高达模型取件表 - 主要JavaScript逻辑
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const elements = {
        // 主界面元素
        gundamList: document.getElementById('gundam-list'),
        noData: document.getElementById('no-data'),
        searchInput: document.getElementById('search-input'),
        addGundamBtn: document.getElementById('add-gundam-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        
        // 模态框
        gundamModal: document.getElementById('gundam-modal'),
        detailModal: document.getElementById('detail-modal'),
        importModal: document.getElementById('import-modal'),
        deleteModal: document.getElementById('delete-modal'),
        
        // 表单元素
        gundamForm: document.getElementById('gundam-form'),
        gundamId: document.getElementById('gundam-id'),
        gundamModel: document.getElementById('gundam-model'),
        gundamImage: document.getElementById('gundam-image'),
        partsContainer: document.getElementById('parts-container'),
        addMainPart: document.getElementById('add-main-part'),
        
        // 详情元素
        detailTitle: document.getElementById('detail-title'),
        detailImage: document.getElementById('detail-image'),
        detailParts: document.getElementById('detail-parts'),
        
        // 按钮
        closeModal: document.getElementById('close-modal'),
        cancelBtn: document.getElementById('cancel-btn'),
        closeDetail: document.getElementById('close-detail'),
        editGundam: document.getElementById('edit-gundam'),
        importBtn: document.getElementById('import-btn'),
        exportBtn: document.getElementById('export-btn'),
        closeImport: document.getElementById('close-import'),
        cancelImport: document.getElementById('cancel-import'),
        confirmImport: document.getElementById('confirm-import'),
        importData: document.getElementById('import-data'),
        cancelDelete: document.getElementById('cancel-delete'),
        confirmDelete: document.getElementById('confirm-delete'),
        
        // 批量导入元素
        batchImportBtn: document.getElementById('batch-import-btn'),
        batchImportText: document.getElementById('batch-import-text'),
        batchMainPart: document.getElementById('batch-main-part'),
        batchImportModal: document.getElementById('batch-import-modal'),
        closeBatchImportBtn: document.getElementById('close-batch-import'),
        confirmBatchImport: document.getElementById('confirm-batch-import'),
        cancelBatchImport: document.getElementById('cancel-batch-import')
    };
    
    // 当前编辑/查看的高达ID
    let currentGundamId = null;
    
    // 初始化
    init();
    
    // 初始化函数
    async function init() {
        try {
            // 初始化数据库
            await GundamDB.init();
            
            // 加载并显示高达列表
            await renderGundamList();
            
            // 绑定事件
            bindEvents();
            
            // 初始化成功
            console.log('应用初始化成功');
        } catch (error) {
            console.error('应用初始化失败:', error);
            alert('应用加载失败，请刷新页面重试');
        }
    }
    
    // 绑定事件处理函数
    function bindEvents() {
        // 主题切换
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // 搜索功能
        elements.searchInput.addEventListener('input', handleSearch);
        
        // 添加高达按钮
        elements.addGundamBtn.addEventListener('click', showAddGundamModal);
        
        // 模态框关闭按钮
        elements.closeModal.addEventListener('click', closeGundamModal);
        elements.cancelBtn.addEventListener('click', closeGundamModal);
        elements.closeDetail.addEventListener('click', closeDetailModal);
        elements.closeImport.addEventListener('click', closeImportModal);
        elements.cancelImport.addEventListener('click', closeImportModal);
        elements.cancelDelete.addEventListener('click', closeDeleteModal);
        
        // 表单提交
        elements.gundamForm.addEventListener('submit', handleFormSubmit);
        
        // 添加主部位按钮
        elements.addMainPart.addEventListener('click', addMainPartField);
        
        // 编辑高达按钮
        elements.editGundam.addEventListener('click', handleEditGundam);
        
        // 导入/导出按钮
        elements.importBtn.addEventListener('click', showImportModal);
        elements.exportBtn.addEventListener('click', handleExport);
        elements.confirmImport.addEventListener('click', handleImport);
        
        // 确认删除按钮
        elements.confirmDelete.addEventListener('click', confirmDelete);
        
        // 添加批量识别按钮事件
        if (elements.batchImportBtn) {
            elements.batchImportBtn.addEventListener('click', showBatchImportModal);
        }
        
        // 批量导入确认按钮
        if (elements.confirmBatchImport) {
            elements.confirmBatchImport.addEventListener('click', handleBatchImport);
        }
        
        // 批量导入取消按钮
        if (elements.cancelBatchImport) {
            elements.cancelBatchImport.addEventListener('click', closeBatchImportModal);
        }
        
        // 关闭批量导入模态框按钮
        if (elements.closeBatchImportBtn) {
            elements.closeBatchImportBtn.addEventListener('click', closeBatchImportModal);
        }
    }
    
    // 渲染高达列表
    async function renderGundamList(models) {
        try {
            // 如果没有传入模型列表，则获取所有模型
            const gundamModels = models || await GundamDB.getAllModels();
            
            // 确保gundamModels是数组
            if (!Array.isArray(gundamModels)) {
                throw new Error('无效的模型数据');
            }
            
            // 清空列表
            elements.gundamList.innerHTML = '';
            
            // 检查是否有数据
            if (gundamModels.length === 0) {
                elements.noData.classList.remove('hidden');
                return;
            }
            
            elements.noData.classList.add('hidden');
            
            // 渲染每个高达卡片
            gundamModels.forEach(gundam => {
                const card = createGundamCard(gundam);
                elements.gundamList.appendChild(card);
            });
        } catch (error) {
            console.error('渲染列表失败:', error);
            elements.noData.classList.remove('hidden');
        }
    }
    
    // 创建高达卡片
    function createGundamCard(gundam) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover-scale transition-all duration-300 fade-in';
        card.dataset.id = gundam.id;
        
        // 获取部件数量统计
        const partsCount = countParts(gundam.parts || []);
        
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden">
                <img src="${gundam.image || 'assets/img/placeholder.webp'}" alt="${gundam.model}" 
                     class="w-full h-full object-cover">
                <div class="absolute top-2 right-2 flex space-x-2">
                    <button class="edit-btn blur-circle bg-blue-500 bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition">
                        <i class="fas fa-edit text-blue-500"></i>
                    </button>
                    <button class="delete-btn blur-circle bg-red-500 bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition">
                        <i class="fas fa-trash text-red-500"></i>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">${gundam.model}</h3>
                <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span><i class="fas fa-layer-group mr-1"></i> ${partsCount.mainParts} 主部位</span>
                    <span><i class="fas fa-puzzle-piece mr-1"></i> ${partsCount.subParts} 子部位</span>
                    <span><i class="fas fa-cubes mr-1"></i> ${partsCount.components} 板件</span>
                </div>
            </div>
        `;
        
        // 绑定卡片点击事件
        card.addEventListener('click', (e) => {
            // 如果点击的是编辑或删除按钮，不触发查看详情
            if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                showDetailModal(gundam.id);
            }
        });
        
        // 绑定编辑按钮点击事件
        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditGundamModal(gundam.id);
        });
        
        // 绑定删除按钮点击事件
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(gundam.id);
        });
        
        return card;
    }
    
    // 统计部件数量
    function countParts(parts) {
        const counts = {
            mainParts: parts.length,
            subParts: 0,
            components: 0
        };
        
        parts.forEach(mainPart => {
            if (mainPart.subParts && Array.isArray(mainPart.subParts)) {
                counts.subParts += mainPart.subParts.length;
                
                mainPart.subParts.forEach(subPart => {
                    if (subPart.components && Array.isArray(subPart.components)) {
                        counts.components += subPart.components.length;
                    }
                });
            }
        });
        
        return counts;
    }
    
    // 显示添加高达模态框
    function showAddGundamModal() {
        // 重置表单
        elements.gundamForm.reset();
        elements.gundamId.value = '';
        elements.partsContainer.innerHTML = '';
        
        // 添加一个默认的主部位
        addMainPartField();
        
        // 更新模态框标题
        document.getElementById('modal-title').textContent = '添加高达模型';
        
        // 显示模态框
        elements.gundamModal.classList.remove('hidden');
    }
    
    // 显示编辑高达模态框
    function showEditGundamModal(id) {
        const gundam = GundamDB.getModel(id);
        if (!gundam) return;
        
        // 设置当前编辑的高达ID
        currentGundamId = id;
        
        // 填充表单
        elements.gundamId.value = id;
        elements.gundamModel.value = gundam.model || '';
        elements.gundamImage.value = gundam.image || '';
        
        // 清空部件容器
        elements.partsContainer.innerHTML = '';
        
        // 添加现有部件
        if (gundam.parts && Array.isArray(gundam.parts)) {
            gundam.parts.forEach(mainPart => {
                const mainPartGroup = addMainPartField();
                const mainPartInput = mainPartGroup.querySelector('.main-part-input');
                mainPartInput.value = mainPart.name || '';
                
                if (mainPart.subParts && Array.isArray(mainPart.subParts)) {
                    mainPart.subParts.forEach(subPart => {
                        const subPartGroup = addSubPartField(mainPartGroup.querySelector('.sub-parts-container'));
                        const subPartInput = subPartGroup.querySelector('.sub-part-input');
                        subPartInput.value = subPart.name || '';
                        
                        if (subPart.components && Array.isArray(subPart.components)) {
                            subPart.components.forEach(component => {
                                const componentGroup = addComponentField(subPartGroup.querySelector('.components-container'));
                                const componentInput = componentGroup.querySelector('.component-input');
                                componentInput.value = component || '';
                            });
                        }
                    });
                }
            });
        }
        
        // 更新模态框标题
        document.getElementById('modal-title').textContent = '编辑高达模型';
        
        // 显示模态框
        elements.gundamModal.classList.remove('hidden');
    }
    
    // 添加主部位字段
    function addMainPartField() {
        const mainPartId = Date.now().toString();
        const mainPartGroup = document.createElement('div');
        mainPartGroup.className = 'main-part-group border border-gray-300 dark:border-gray-700 rounded-md p-4 mb-4';
        mainPartGroup.dataset.id = mainPartId;
        
        mainPartGroup.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-medium">主部位名称</label>
                    <input type="text" class="main-part-input w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" 
                           placeholder="例如：骨架、外甲、武器" required>
                </div>
                <button type="button" class="remove-main-part ml-2 p-2 text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="sub-parts-container space-y-3">
                <!-- 子部位将在这里动态添加 -->
            </div>
            
            <button type="button" class="add-sub-part mt-3 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition">
                <i class="fas fa-plus mr-1"></i>添加子部位
            </button>
        `;
        
        // 绑定删除主部位按钮事件
        const removeBtn = mainPartGroup.querySelector('.remove-main-part');
        removeBtn.addEventListener('click', function() {
            mainPartGroup.remove();
        });
        
        // 绑定添加子部位按钮事件
        const addSubPartBtn = mainPartGroup.querySelector('.add-sub-part');
        addSubPartBtn.addEventListener('click', function() {
            const subPartsContainer = mainPartGroup.querySelector('.sub-parts-container');
            addSubPartField(subPartsContainer);
        });
        
        elements.partsContainer.appendChild(mainPartGroup);
        
        // 默认添加一个子部位
        const subPartsContainer = mainPartGroup.querySelector('.sub-parts-container');
        addSubPartField(subPartsContainer);
        
        return mainPartGroup;
    }
    
    // 添加子部位字段
    function addSubPartField(container) {
        const subPartId = Date.now().toString();
        const subPartGroup = document.createElement('div');
        subPartGroup.className = 'sub-part-group bg-gray-50 dark:bg-gray-850 p-3 rounded-md';
        subPartGroup.dataset.id = subPartId;
        
        subPartGroup.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex-1">
                    <label class="block mb-1 text-sm font-medium">子部位名称</label>
                    <input type="text" class="sub-part-input w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" 
                           placeholder="例如：左臂、右臂、头部" required>
                </div>
                <button type="button" class="remove-sub-part ml-2 p-2 text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="components-container space-y-2 ml-3">
                <!-- 板件将在这里动态添加 -->
            </div>
            
            <button type="button" class="add-component mt-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition">
                <i class="fas fa-plus mr-1"></i>添加板件
            </button>
        `;
        
        // 绑定删除子部位按钮事件
        const removeBtn = subPartGroup.querySelector('.remove-sub-part');
        removeBtn.addEventListener('click', function() {
            subPartGroup.remove();
        });
        
        // 绑定添加板件按钮事件
        const addComponentBtn = subPartGroup.querySelector('.add-component');
        addComponentBtn.addEventListener('click', function() {
            const componentsContainer = subPartGroup.querySelector('.components-container');
            addComponentField(componentsContainer);
        });
        
        container.appendChild(subPartGroup);
        
        // 默认添加一个板件
        const componentsContainer = subPartGroup.querySelector('.components-container');
        addComponentField(componentsContainer);
        
        return subPartGroup;
    }
    
    // 添加板件字段
    function addComponentField(container) {
        const componentId = Date.now().toString();
        const componentGroup = document.createElement('div');
        componentGroup.className = 'component-group flex items-center';
        componentGroup.dataset.id = componentId;
        
        componentGroup.innerHTML = `
            <div class="flex-1">
                <input type="text" class="component-input w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" 
                       placeholder="板件名称" required>
            </div>
            <button type="button" class="remove-component ml-2 p-2 text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 绑定删除板件按钮事件
        const removeBtn = componentGroup.querySelector('.remove-component');
        removeBtn.addEventListener('click', function() {
            componentGroup.remove();
        });
        
        container.appendChild(componentGroup);
        return componentGroup;
    }
    
    // 处理表单提交
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        // 收集表单数据
        const gundamData = {
            model: elements.gundamModel.value.trim(),
            image: elements.gundamImage.value.trim(),
            parts: []
        };
        
        // 收集主部位数据
        const mainPartGroups = elements.partsContainer.querySelectorAll('.main-part-group');
        mainPartGroups.forEach(mainPartGroup => {
            const mainPartInput = mainPartGroup.querySelector('.main-part-input');
            const mainPartName = mainPartInput.value.trim();
            
            if (mainPartName) {
                const mainPart = {
                    name: mainPartName,
                    subParts: []
                };
                
                // 收集子部位数据
                const subPartGroups = mainPartGroup.querySelectorAll('.sub-part-group');
                subPartGroups.forEach(subPartGroup => {
                    const subPartInput = subPartGroup.querySelector('.sub-part-input');
                    const subPartName = subPartInput.value.trim();
                    
                    if (subPartName) {
                        const subPart = {
                            name: subPartName,
                            components: []
                        };
                        
                        // 收集板件数据
                        const componentGroups = subPartGroup.querySelectorAll('.component-group');
                        componentGroups.forEach(componentGroup => {
                            const componentInput = componentGroup.querySelector('.component-input');
                            const componentName = componentInput.value.trim();
                            
                            if (componentName) {
                                subPart.components.push(componentName);
                            }
                        });
                        
                        mainPart.subParts.push(subPart);
                    }
                });
                
                gundamData.parts.push(mainPart);
            }
        });
        
        // 保存数据
        const id = elements.gundamId.value;
        if (id) {
            // 更新现有高达
            await GundamDB.updateModel(id, gundamData);
        } else {
            // 添加新高达
            await GundamDB.addModel(gundamData);
        }
        
        // 关闭模态框
        closeGundamModal();
        
        // 刷新高达列表
        renderGundamList();
    }
    
    // 显示高达详情模态框
    async function showDetailModal(id) {
        const gundam = await GundamDB.getModel(id);
        if (!gundam) return;
        
        // 设置当前查看的高达ID
        currentGundamId = id;
        
        // 更新详情标题和图片
        elements.detailTitle.textContent = gundam.model;
        elements.detailImage.src = gundam.image || 'assets/img/placeholder.webp';
        elements.detailImage.alt = gundam.model;
        
        // 添加视图切换按钮
        const viewToggleContainer = document.getElementById('view-toggle-container');
        viewToggleContainer.innerHTML = `
            <div class="inline-flex rounded-md shadow-sm mb-4" role="group">
                <button type="button" id="view-by-part" class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-l-lg">
                    按部位查看
                </button>
                <button type="button" id="view-by-runner" class="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-r-lg">
                    按板件查看
                </button>
            </div>
        `;
        
        // 绑定视图切换事件
        document.getElementById('view-by-part').addEventListener('click', function() {
            this.classList.replace('bg-gray-200', 'bg-blue-600');
            this.classList.replace('text-gray-700', 'text-white');
            document.getElementById('view-by-runner').classList.replace('bg-blue-600', 'bg-gray-200');
            document.getElementById('view-by-runner').classList.replace('text-white', 'text-gray-700');
            renderPartView(gundam);
        });
        
        document.getElementById('view-by-runner').addEventListener('click', function() {
            this.classList.replace('bg-gray-200', 'bg-blue-600');
            this.classList.replace('text-gray-700', 'text-white');
            document.getElementById('view-by-part').classList.replace('bg-blue-600', 'bg-gray-200');
            document.getElementById('view-by-part').classList.replace('text-white', 'text-gray-700');
            renderRunnerView(gundam.id);
        });
        
        // 默认显示按部位视图
        renderPartView(gundam);
        
        // 显示详情模态框
        elements.detailModal.classList.remove('hidden');
    }
    
    // 渲染按部位视图
    function renderPartView(gundam) {
        // 清空详情容器
        elements.detailParts.innerHTML = '';
        
        // 渲染取件表
        if (gundam.parts && Array.isArray(gundam.parts)) {
            gundam.parts.forEach(mainPart => {
                const mainPartElement = document.createElement('div');
                mainPartElement.className = 'main-part bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4';
                
                mainPartElement.innerHTML = `
                    <h4 class="text-md font-semibold mb-3">${mainPart.name}</h4>
                    <div class="sub-parts-list space-y-3">
                        <!-- 子部位将在这里动态添加 -->
                    </div>
                `;
                
                const subPartsList = mainPartElement.querySelector('.sub-parts-list');
                
                if (mainPart.subParts && Array.isArray(mainPart.subParts)) {
                    mainPart.subParts.forEach(subPart => {
                        const subPartElement = document.createElement('div');
                        subPartElement.className = 'sub-part bg-gray-50 dark:bg-gray-750 p-3 rounded-md';
                        
                        let componentsHTML = '';
                        if (subPart.components && Array.isArray(subPart.components)) {
                            componentsHTML = `
                                <div class="components-list mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    ${subPart.components.map(component => 
                                        `<div class="component bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded text-sm">${component}</div>`
                                    ).join('')}
                                </div>
                            `;
                        }
                        
                        subPartElement.innerHTML = `
                            <h5 class="text-sm font-medium mb-1">${subPart.name}</h5>
                            ${componentsHTML}
                        `;
                        
                        subPartsList.appendChild(subPartElement);
                    });
                }
                
                elements.detailParts.appendChild(mainPartElement);
            });
        } else {
            elements.detailParts.innerHTML = '<p class="text-gray-500 dark:text-gray-400">暂无取件表数据</p>';
        }
    }
    
    // 渲染按板件视图
    async function renderRunnerView(gundamId) {
        // 清空详情容器
        elements.detailParts.innerHTML = '';
        
        // 获取所有板件
        const runners = await GundamDB.getAllRunners(gundamId);
        
        if (runners.length === 0) {
            elements.detailParts.innerHTML = '<p class="text-gray-500 dark:text-gray-400">暂无板件数据</p>';
            return;
        }
        
        // 渲染板件列表
        runners.forEach(runner => {
            const runnerElement = document.createElement('div');
            runnerElement.className = 'runner bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4';
            
            // 对相同部位的板件号码进行合并
            const partsByLocation = new Map();
            
            runner.parts.forEach(part => {
                const locationKey = `${part.mainPart}-${part.subPart}`;
                
                if (!partsByLocation.has(locationKey)) {
                    partsByLocation.set(locationKey, {
                        mainPart: part.mainPart,
                        subPart: part.subPart,
                        numbers: []
                    });
                }
                
                partsByLocation.get(locationKey).numbers.push(part.numbers);
            });
            
            let partsHTML = '';
            if (partsByLocation.size > 0) {
                partsHTML = `
                    <div class="runner-parts mt-2">
                        ${Array.from(partsByLocation.values()).map(part => `
                            <div class="runner-part bg-gray-50 dark:bg-gray-750 p-3 rounded-md mb-2">
                                <div class="text-sm font-medium">${part.mainPart} - ${part.subPart}</div>
                                <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">${part.numbers.join('、')}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            runnerElement.innerHTML = `
                <div class="flex items-center mb-2">
                    <h4 class="text-md font-semibold">板件 ${runner.id}</h4>
                    <span class="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                        ${partsByLocation.size} 个部位
                    </span>
                </div>
                ${partsHTML}
            `;
            
            elements.detailParts.appendChild(runnerElement);
        });
    }
    
    // 处理编辑高达按钮点击
    function handleEditGundam() {
        if (currentGundamId) {
            closeDetailModal();
            showEditGundamModal(currentGundamId);
        }
    }
    
    // 显示删除确认模态框
    function showDeleteConfirmation(id) {
        currentGundamId = id;
        elements.deleteModal.classList.remove('hidden');
    }
    
    // 确认删除高达
    function confirmDelete() {
        if (currentGundamId) {
            GundamDB.deleteModel(currentGundamId);
            closeDeleteModal();
            renderGundamList();
        }
    }
    
    // 处理搜索
    async function handleSearch() {
        const query = elements.searchInput.value.trim();
        const results = await GundamDB.searchModels(query);
        renderGundamList(results);
    }
    
    // 显示导入模态框
    function showImportModal() {
        elements.importData.value = '';
        elements.importModal.classList.remove('hidden');
    }
    
    // 处理导入
    async function handleImport() {
        const jsonData = elements.importData.value.trim();
        
        if (!jsonData) {
            alert('请输入有效的JSON数据');
            return;
        }
        
        try {
            const success = await GundamDB.importData(jsonData);
            
            if (success) {
                alert('数据导入成功');
                closeImportModal();
                renderGundamList();
            } else {
                alert('数据导入失败');
            }
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    }
    
    // 处理导出
    async function handleExport() {
        try {
            const data = await GundamDB.exportData();
            
            // 创建下载链接
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gundam_models_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }
    
    // 切换主题
    function toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    }
    
    // 关闭模态框函数
    function closeGundamModal() {
        elements.gundamModal.classList.add('hidden');
        currentGundamId = null;
    }
    
    function closeDetailModal() {
        elements.detailModal.classList.add('hidden');
        currentGundamId = null;
    }
    
    function closeImportModal() {
        elements.importModal.classList.add('hidden');
    }
    
    function closeDeleteModal() {
        elements.deleteModal.classList.add('hidden');
        currentGundamId = null;
    }
    
    // 显示批量导入模态框
    function showBatchImportModal() {
        const batchImportModal = document.getElementById('batch-import-modal');
        const batchImportText = document.getElementById('batch-import-text');
        
        if (batchImportModal && batchImportText) {
            batchImportText.value = '';
            batchImportModal.classList.remove('hidden');
        }
    }
    
    // 关闭批量导入模态框
    function closeBatchImportModal() {
        const batchImportModal = document.getElementById('batch-import-modal');
        if (batchImportModal) {
            batchImportModal.classList.add('hidden');
        }
    }
    
    // 处理批量导入
    function handleBatchImport() {
        const batchImportText = document.getElementById('batch-import-text');
        const mainPartName = document.getElementById('batch-main-part').value.trim();
        
        if (!batchImportText || !mainPartName) {
            alert('请输入主部位名称和取件表数据');
            return;
        }
        
        const text = batchImportText.value.trim();
        if (!text) {
            alert('请输入取件表数据');
            return;
        }
        
        try {
            // 解析批量文本
            const parsedParts = parseBatchText(text, mainPartName);
            
            // 将解析结果添加到当前编辑的高达模型中
            addParsedPartsToForm(parsedParts);
            
            // 关闭模态框
            closeBatchImportModal();
        } catch (error) {
            alert('解析失败: ' + error.message);
        }
    }
    
    // 改进解析批量文本函数
    function parseBatchText(text, mainPartName) {
        // 按行分割
        const lines = text.split('\n').filter(line => line.trim());
        
        const result = {
            name: mainPartName,
            subParts: []
        };
        
        // 检测格式类型
        const isTabFormat = text.includes('\t');
        
        if (isTabFormat) {
            // 处理制表符分隔的格式
            let currentSubPart = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];  // 不要trim，保留前导空白
                
                // 检查是否是延续行（以制表符开头）
                const isExtensionLine = line.startsWith('\t');
                
                const parts = line.split('\t').filter(p => p !== '');  // 只过滤空字符串，不trim
                
                if (parts.length >= 1) {
                    // 如果不是延续行，这是一个新的子部位行
                    if (!isExtensionLine) {
                        const subPartName = parts[0].trim();
                        
                        // 创建新的子部位
                        currentSubPart = {
                            name: subPartName,
                            components: []
                        };
                        
                        // 添加该行的组件
                        for (let j = 1; j < parts.length; j++) {
                            if (parts[j].trim()) {
                                currentSubPart.components.push(parts[j].trim());
                            }
                        }
                        
                        result.subParts.push(currentSubPart);
                    } 
                    // 否则，这是前一个子部位的延续行
                    else if (currentSubPart) {
                        // 添加该行的组件
                        for (let j = 0; j < parts.length; j++) {  // 从0开始，因为第一列可能有内容
                            if (parts[j].trim()) {
                                currentSubPart.components.push(parts[j].trim());
                            }
                        }
                    }
                }
            }
        } else {
            // 处理其他格式（如图片中所示的格式）
            const isNewFormat = lines.some(line => /^[A-Z]/.test(line.trim()));
            
            if (isNewFormat) {
                // 处理新格式（板件ID行后跟号码行）
                let currentSubPart = null;
                let currentRunnerId = null;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // 检查是否是子部位行（如"右腿"、"左臂"等）
                    if (/^[\u4e00-\u9fa5]+部?$/.test(line)) {
                        currentSubPart = {
                            name: line,
                            components: []
                        };
                        result.subParts.push(currentSubPart);
                        currentRunnerId = null;
                    } 
                    // 检查是否是板件ID行（如"A"、"B1"等）
                    else if (/^[A-Z][0-9]*$/.test(line)) {
                        currentRunnerId = line;
                    }
                    // 否则是板件号码行
                    else if (currentSubPart && currentRunnerId) {
                        const numbers = line.trim();
                        currentSubPart.components.push(`${currentRunnerId}: ${numbers}`);
                    }
                }
            } else {
                // 处理简单格式（每行以部位名称开头，后面跟着数字列表）
                let currentSubPart = null;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // 分割部位名称和数字列表
                    const parts = line.split(/\s+/);
                    
                    if (parts.length >= 2 && /^[\u4e00-\u9fa5]+/.test(parts[0])) {
                        // 第一部分是子部位名称（中文）
                        const subPartName = parts[0].trim();
                        
                        // 创建新的子部位
                        currentSubPart = {
                            name: subPartName,
                            components: []
                        };
                        
                        // 剩余部分是板件号码
                        const numbers = parts.slice(1).join('、');
                        
                        // 对于简单格式，我们假设所有号码都属于同一个板件（从部位名称推断）
                        // 这里我们使用"A"作为默认板件ID，您可以根据需要修改
                        currentSubPart.components.push(`A: ${numbers}`);
                        
                        result.subParts.push(currentSubPart);
                    } else if (currentSubPart && parts.length >= 1) {
                        // 这是前一个子部位的继续行
                        const numbers = parts.join('、');
                        
                        // 我们假设这些也是A板件的号码
                        currentSubPart.components.push(`A: ${numbers}`);
                    }
                }
            }
        }
        
        // 如果没有解析出任何子部位，抛出错误
        if (result.subParts.length === 0) {
            throw new Error('无法识别的数据格式或未找到有效数据');
        }
        
        return result;
    }
    
    // 将解析结果添加到表单中
    function addParsedPartsToForm(parsedPart) {
        // 创建主部位
        const mainPartGroup = addMainPartField();
        const mainPartInput = mainPartGroup.querySelector('.main-part-input');
        mainPartInput.value = parsedPart.name;
        
        // 清除默认添加的子部位
        const subPartsContainer = mainPartGroup.querySelector('.sub-parts-container');
        subPartsContainer.innerHTML = '';
        
        // 添加解析出的子部位
        parsedPart.subParts.forEach(subPart => {
            const subPartGroup = addSubPartField(subPartsContainer);
            const subPartInput = subPartGroup.querySelector('.sub-part-input');
            subPartInput.value = subPart.name;
            
            // 清除默认添加的板件
            const componentsContainer = subPartGroup.querySelector('.components-container');
            componentsContainer.innerHTML = '';
            
            // 添加解析出的板件
            subPart.components.forEach(component => {
                const componentGroup = addComponentField(componentsContainer);
                const componentInput = componentGroup.querySelector('.component-input');
                componentInput.value = component;
            });
        });
    }
});