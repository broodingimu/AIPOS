class POSSystem {
    constructor() {
        this.products = new Map();  // 商品列表
        this.currentBarcode = '';  // 当前输入的条码
        this.errorTimeout = null;  // 错误提示定时器
        this.isFullscreen = false; // 全屏状态

        // 初始化UI元素
        this.productList = document.getElementById('productList');
        this.totalAmount = document.getElementById('totalAmount');
        this.languageSelect = document.getElementById('languageSelect');
        this.paymentModal = document.getElementById('paymentModal');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.barcodeInput = document.getElementById('barcodeInput');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        // 绑定事件
        this.bindEvents();
        
        // 初始化系统
        this.init();
    }

    async init() {
        try {
            // 加载商品数据
            await this.loadProducts();
            
            // 更新UI语言
            this.updateUILanguage();

            // 自动进入全屏模式
            this.toggleFullscreen();
        } catch (error) {
            console.error('系统初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }

    bindEvents() {
        // 全屏按钮点击事件
        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 语言切换
        this.languageSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            languageManager.setLanguage(selectedOption.text);
            this.updateUILanguage();
        });

        // 支付模态框按钮
        document.getElementById('cancelPayment').addEventListener('click', () => {
            this.paymentModal.style.display = 'none';
            this.barcodeInput.focus();
        });

        document.getElementById('confirmPayment').addEventListener('click', () => {
            this.confirmPayment();
        });

        // 条码输入框事件
        this.barcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.paymentModal.style.display === 'flex') {
                    this.confirmPayment();
                } else {
                    this.processBarcode(this.barcodeInput.value);
                    this.barcodeInput.value = '';
                }
            }
        });

        // 全局键盘事件
        document.addEventListener('keypress', (e) => {
            // 如果当前焦点在输入框，不处理
            if (document.activeElement === this.barcodeInput) {
                return;
            }
            
            // 阻止默认行为
            e.preventDefault();

            // 如果是回车键
            if (e.key === 'Enter') {
                if (this.currentBarcode) {
                    if (this.paymentModal.style.display === 'flex') {
                        this.confirmPayment();
                    } else {
                        this.processBarcode(this.currentBarcode);
                    }
                    this.currentBarcode = '';
                    this.barcodeInput.value = '';
                }
            } else {
                // 累积输入的字符
                this.currentBarcode += e.key;
                // 同步显示到输入框
                this.barcodeInput.value = this.currentBarcode;
            }
        });

        // 点击总金额区域显示支付确认
        this.totalAmount.addEventListener('click', () => {
            if (this.getTotal() > 0) {
                this.showPaymentModal();
            }
        });
    }

    async loadProducts() {
        try {
            this.products = new Map();
            for (const [barcode, name, price, unit] of PRODUCTS_DATA) {
                this.products.set(barcode, { 
                    name, 
                    price: parseFloat(price), 
                    unit: unit.trim()
                });
            }

            if (this.products.size === 0) {
                throw new Error('没有加载到任何商品数据');
            }

            console.log('成功加载商品数据，共', this.products.size, '个商品');
        } catch (error) {
            console.error('加载商品数据失败:', error);
            this.showError('加载商品数据失败：' + error.message);
        }
    }

    processBarcode(barcode) {
        const result = BarcodeParser.parse(barcode);
        
        // 检查基本错误（空条码、格式错误等）
        if (result.errorCode === 1 || result.errorCode === 3) {
            this.showError(result.errorMessage);
            return;
        }

        const product = this.products.get(result.plu);
        if (!product) {
            this.showError('商品不存在');
            return;
        }

        // 检查商品是否超期
        if (result.errorCode === 2) {
            this.showError(result.errorMessage);
            return;
        }

        // 计算商品金额
        let price, quantity, subtotal;
        
        if (barcode.length === 30) {
            // 30位码：使用商品库单价，条码金额作为小计，weight作为数量
            price = product.price;
            quantity = result.weight;
            subtotal = result.amount;
        } else {
            // 其他码：使用原来的逻辑
            price = result.amount || product.price;
            quantity = result.weight || 1;
            subtotal = price * quantity;
        }

        // 添加商品到列表
        this.addProductToList({
            name: product.name,
            price: price.toFixed(2),
            quantity: quantity.toFixed(3),
            subtotal: subtotal.toFixed(2),
            unit: product.unit
        });

        // 更新总金额
        this.updateTotal();
    }

    addProductToList(product) {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        const currencySymbol = languageManager.getText('currency_symbol');
        productElement.innerHTML = `
            <div>${product.name}</div>
            <div>${currencySymbol}${product.price}</div>
            <div>${product.quantity}${product.unit || ''}</div>
            <div>${currencySymbol}${product.subtotal}</div>
        `;
        
        // 在列表开头插入新商品
        const firstItem = this.productList.firstChild;
        this.productList.insertBefore(productElement, firstItem);
    }

    getTotal() {
        let total = 0;
        const items = this.productList.getElementsByClassName('product-item');
        for (const item of items) {
            // 移除货币符号，只保留数字部分
            const subtotalText = item.children[3].textContent.replace(/[^\d.-]/g, '');
            const subtotal = parseFloat(subtotalText);
            if (!isNaN(subtotal)) {
                total += subtotal;
            }
        }
        return total;
    }

    updateTotal() {
        const total = this.getTotal();
        const currencySymbol = languageManager.getText('currency_symbol');
        this.totalAmount.textContent = `${languageManager.getText('payment_prefix')}${currencySymbol}${total.toFixed(2)}`;
    }

    showPaymentModal() {
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentModalTitle');
        const message = document.getElementById('paymentModalMessage');
        const cancelBtn = document.getElementById('cancelPayment');
        const confirmBtn = document.getElementById('confirmPayment');

        title.textContent = languageManager.getText('payment_confirmation');
        message.textContent = languageManager.getText('scan_payment');
        cancelBtn.textContent = languageManager.getText('cancel');
        confirmBtn.textContent = languageManager.getText('confirm');

        modal.style.display = 'flex';
        this.barcodeInput.disabled = true;
    }

    confirmPayment() {
        // 清空商品列表
        this.productList.innerHTML = '';
        this.updateTotal();
        this.paymentModal.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.style.display = 'block';

        // 清除之前的定时器
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }

        // 设置新的定时器，3秒后自动关闭
        this.errorTimeout = setTimeout(() => {
            this.errorModal.style.display = 'none';
        }, 3000);
    }

    updateUILanguage() {
        // 更新标题
        document.querySelector('.title').textContent = 'AIPOS';
        
        // 更新全屏按钮文本
        this.fullscreenBtn.querySelector('span').textContent = this.isFullscreen ? '退出全屏' : '全屏';
        
        // 更新表头
        const header = document.querySelector('.product-header');
        header.children[0].textContent = languageManager.getText('product_name');
        header.children[1].textContent = languageManager.getText('price');
        header.children[2].textContent = languageManager.getText('quantity');
        header.children[3].textContent = languageManager.getText('subtotal');
        
        // 更新输入框占位符
        this.barcodeInput.placeholder = languageManager.getText('scan_barcode');
        
        // 更新模态框
        document.querySelector('#paymentModal .modal-title').textContent = languageManager.getText('payment_confirmation');
        document.querySelector('#paymentModal .modal-message').textContent = languageManager.getText('scan_barcode');
        document.querySelector('#paymentModal .modal-button#cancelPayment').textContent = languageManager.getText('cancel');
        document.querySelector('#paymentModal .modal-button#confirmPayment').textContent = languageManager.getText('confirm');
        
        // 更新总金额
        this.updateTotal();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`全屏请求失败: ${err.message}`);
            });
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.isFullscreen = false;
            }
        }
    }
}

// 创建POS系统实例
const posSystem = new POSSystem(); 