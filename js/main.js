class POSSystem {
    constructor() {
        this.products = new Map();  // 商品列表
        this.currentProductsData = [];
        this.currentBarcode = '';  // 当前输入的条码
        this.errorTimeout = null;  // 错误提示定时器
        this.isFullscreen = false; // 全屏状态
        this.heldOrderItems = [];  // 挂单缓存
        this.lastOrderItems = [];  // 上单缓存
        this.isOrderHeld = false;  // 挂单状态
        this.selectedItemIndex = -1; // 当前选中条目索引
        this.currentPayActionKey = ''; // 当前支付动作键

        // 初始化UI元素
        this.productList = document.getElementById('productList');
        this.totalAmount = document.getElementById('totalAmount');
        this.languageSelect = document.getElementById('languageSelect');
        this.paymentModal = document.getElementById('paymentModal');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.barcodeInput = document.getElementById('barcodeInput');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.btnCancelOrder = document.getElementById('btnCancelOrder');
        this.btnHoldOrder = document.getElementById('btnHoldOrder');
        this.btnCashPay = document.getElementById('btnCashPay');
        this.btnUnionPay = document.getElementById('btnUnionPay');
        this.btnAlipay = document.getElementById('btnAlipay');
        this.btnWechatPay = document.getElementById('btnWechatPay');
        this.btnSettle = document.getElementById('btnSettle');
        this.btnCashDrawer = document.getElementById('btnCashDrawer');
        this.btnReprintLast = document.getElementById('btnReprintLast');
        this.btnMemberCard = document.getElementById('btnMemberCard');

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
            // this.toggleFullscreen();
        } catch (error) {
            console.error('系统初始化失败:', error);
            this.showError(`${languageManager.getText('system_init_failed')}: ${error.message}`);
        }
    }

    bindEvents() {
        // 全屏按钮点击事件
        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 语言切换
        this.languageSelect.addEventListener('change', async (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            languageManager.setLanguage(selectedOption.text);
            await this.loadProducts();
            this.updateUILanguage();
        });

        // 支付模态框按钮
        document.getElementById('cancelPayment').addEventListener('click', () => {
            this.closePaymentModal();
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

        // 支付弹框回车确认
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.paymentModal.style.display === 'flex') {
                e.preventDefault();
                this.confirmPayment();
            }
        });

        // 全局快捷键
        document.addEventListener('keydown', (e) => {
            if (this.paymentModal.style.display === 'flex') {
                const modalKeyValue = e.key.toLowerCase();
                if (modalKeyValue === 'escape' || modalKeyValue === 'n') {
                    e.preventDefault();
                    this.closePaymentModal();
                    return;
                }
            }
            this.handleShortcutKey(e);
        });

        // 点击总金额区域显示支付确认
        this.totalAmount.addEventListener('click', () => {
            if (this.getTotal() > 0) {
                this.currentPayActionKey = '';
                this.showPaymentModal();
            }
        });

        this.btnCancelOrder.addEventListener('click', () => {
            this.clearCurrentOrder();
            this.barcodeInput.focus();
        });

        this.btnHoldOrder.addEventListener('click', () => {
            this.toggleHeldOrder();
        });

        this.btnCashPay.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_cash');
        });

        this.btnUnionPay.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_union');
        });

        this.btnAlipay.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_alipay');
        });

        this.btnWechatPay.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_wechat');
        });

        this.btnSettle.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_settle');
        });

        this.btnCashDrawer.addEventListener('click', () => {
            this.showError(languageManager.getText('msg_cash_drawer_opened'));
            this.barcodeInput.focus();
        });

        this.btnReprintLast.addEventListener('click', () => {
            if (this.lastOrderItems.length === 0) {
                this.showError(languageManager.getText('msg_no_last_order'));
                return;
            }
            this.restoreOrderFromItems(this.lastOrderItems);
            this.barcodeInput.focus();
        });

        this.btnMemberCard.addEventListener('click', () => {
            this.openPaymentByAction('pay_action_member_card');
        });
    }

    handleShortcutKey(event) {
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

        if (this.paymentModal.style.display === 'flex') {
            return;
        }

        const pressedKey = event.key.toLowerCase();
        const shortcutHandlerMap = {
            'a': () => {
                this.moveSelectedOrderItem(-1);
            },
            'b': () => {
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen();
                    this.isFullscreen = false;
                    this.updateUILanguage();
                }
            },
            'c': () => {
                this.clearCurrentOrder();
                this.barcodeInput.focus();
            },
            'd': () => {
                this.moveSelectedOrderItem(1);
            },
            'e': () => {
                this.toggleHeldOrder();
            },
            'f': () => {
                this.openPaymentByAction('pay_action_cash');
            },
            'g': () => {
                this.openPaymentByAction('pay_action_union');
            },
            'h': () => {
                if (this.lastOrderItems.length === 0) {
                    this.showError(languageManager.getText('msg_no_last_order'));
                    return;
                }
                this.restoreOrderFromItems(this.lastOrderItems);
                this.barcodeInput.focus();
            },
            'i': () => {
                this.openPaymentByAction('pay_action_alipay');
            },
            'j': () => {
                this.openPaymentByAction('pay_action_wechat');
            },
            'k': () => {
                this.clearCurrentOrder();
                this.barcodeInput.focus();
            },
            'l': () => {
                this.openPaymentByAction('pay_action_member_card');
            },
            'm': () => {
                this.showError(languageManager.getText('msg_cash_drawer_opened'));
                this.barcodeInput.focus();
            },
            'n': () => {
                this.removeSelectedOrderItem();
                this.barcodeInput.focus();
            },
            ' ': () => {
                this.openPaymentByAction('pay_action_settle');
            },
            'delete': () => {
                this.clearCurrentOrder();
                this.barcodeInput.focus();
            },
            'backspace': () => {
                this.removeSelectedOrderItem();
                this.barcodeInput.focus();
            },
            'arrowup': () => {
                this.moveSelectedOrderItem(-1);
            },
            'arrowdown': () => {
                this.moveSelectedOrderItem(1);
            },
            'w': () => {
                this.moveSelectedOrderItem(-1);
            },
            's': () => {
                this.moveSelectedOrderItem(1);
            },
            'escape': () => {
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen();
                    this.isFullscreen = false;
                    this.updateUILanguage();
                }
            }
        };

        const shortcutHandler = shortcutHandlerMap[pressedKey];
        if (!shortcutHandler) {
            return;
        }

        event.preventDefault();
        shortcutHandler();
    }

    getCurrentOrderItems() {
        const orderItems = [];
        const itemElements = this.productList.getElementsByClassName('product-item');
        for (const itemElement of itemElements) {
            const nameText = itemElement.children[0].textContent;
            const priceText = itemElement.children[1].textContent.replace(/[^\d.-]/g, '');
            const quantityWithUnitText = itemElement.children[2].textContent;
            const subtotalText = itemElement.children[3].textContent.replace(/[^\d.-]/g, '');
            const quantityMatch = quantityWithUnitText.match(/^[\d.]+/);

            orderItems.push({
                name: nameText,
                price: priceText || '0.00',
                quantity: quantityMatch ? quantityMatch[0] : '0.000',
                subtotal: subtotalText || '0.00',
                unit: quantityWithUnitText.replace(/^[\d.]+/, '')
            });
        }
        return orderItems;
    }

    clearCurrentOrder() {
        this.productList.innerHTML = '';
        this.selectedItemIndex = -1;
        this.updateTotal();
    }

    restoreOrderFromItems(orderItems) {
        this.clearCurrentOrder();
        const restoredItems = [...orderItems].reverse();
        for (const orderItem of restoredItems) {
            this.addProductToList(orderItem);
        }
        this.updateTotal();
    }

    toggleHeldOrder() {
        if (!this.isOrderHeld) {
            const currentOrderItems = this.getCurrentOrderItems();
            if (currentOrderItems.length === 0) {
                this.showError(languageManager.getText('msg_no_items_to_hold'));
                return;
            }
            this.heldOrderItems = currentOrderItems;
            this.clearCurrentOrder();
            this.isOrderHeld = true;
            this.btnHoldOrder.textContent = languageManager.getText('btn_pick_order');
        } else {
            if (this.heldOrderItems.length === 0) {
                this.showError(languageManager.getText('msg_no_held_order'));
                return;
            }
            this.restoreOrderFromItems(this.heldOrderItems);
            this.heldOrderItems = [];
            this.isOrderHeld = false;
            this.btnHoldOrder.textContent = languageManager.getText('btn_hold_order');
        }
        this.barcodeInput.focus();
    }

    openPaymentByAction(payActionKey = '') {
        this.currentPayActionKey = payActionKey;
        if (this.getTotal() <= 0) {
            this.showError(languageManager.getText('msg_no_items_to_settle'));
            return;
        }
        this.showPaymentModal();
    }

    async loadLanguageProductScript() {
        const currentLanguage = languageManager.getCurrentLanguage();
        const languageScriptMap = {
            'English': 'js/plu_en.js',
            '中文': 'js/plu_zh.js'
        };
        const targetScriptPath = languageScriptMap[currentLanguage] || languageScriptMap['中文'];
        const isEnglish = currentLanguage === 'English';

        if (isEnglish && typeof PRODUCTS_DATA_EN !== 'undefined' && Array.isArray(PRODUCTS_DATA_EN)) {
            this.currentProductsData = PRODUCTS_DATA_EN;
            return;
        }

        if (!isEnglish && typeof PRODUCTS_DATA_ZH !== 'undefined' && Array.isArray(PRODUCTS_DATA_ZH)) {
            this.currentProductsData = PRODUCTS_DATA_ZH;
            return;
        }

        await new Promise((resolve, reject) => {
            const existedScript = document.querySelector(`script[data-plu-lang="${currentLanguage}"]`);
            if (existedScript) {
                resolve();
                return;
            }

            const scriptElement = document.createElement('script');
            scriptElement.src = targetScriptPath;
            scriptElement.dataset.pluLang = currentLanguage;
            scriptElement.onload = () => {
                resolve();
            };
            scriptElement.onerror = () => {
                reject(new Error(`Failed to load ${targetScriptPath}`));
            };
            document.body.appendChild(scriptElement);
        });

        if (isEnglish && (typeof PRODUCTS_DATA_EN === 'undefined' || !Array.isArray(PRODUCTS_DATA_EN))) {
            throw new Error(`Invalid product data in ${targetScriptPath}`);
        }

        if (!isEnglish && (typeof PRODUCTS_DATA_ZH === 'undefined' || !Array.isArray(PRODUCTS_DATA_ZH))) {
            throw new Error(`Invalid product data in ${targetScriptPath}`);
        }

        this.currentProductsData = isEnglish ? PRODUCTS_DATA_EN : PRODUCTS_DATA_ZH;
    }

    async loadProducts() {
        try {
            await this.loadLanguageProductScript();
            this.products = new Map();
            for (const [barcode, name, price, unit] of this.currentProductsData) {
                this.products.set(barcode, { 
                    name, 
                    price: parseFloat(price), 
                    unit: unit.trim()
                });
            }

            if (this.products.size === 0) {
                throw new Error(languageManager.getText('no_products_loaded'));
            }

            console.log('成功加载商品数据，共', this.products.size, '个商品');
        } catch (error) {
            console.error('加载商品数据失败:', error);
            this.showError(`${languageManager.getText('load_products_failed')}: ${error.message}`);
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
            this.showError(languageManager.getText('product_not_found'));
            return;
        }

        // 检查商品是否超期
        if (result.errorCode === 2) {
            this.showError(result.errorMessage);
            return;
        }

        // 计算商品金额
        let price, quantity, subtotal;
        
        if (barcode.length === 28) {
            // 28位码：使用商品库单价，条码金额作为小计，weight作为数量
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

        productElement.addEventListener('click', () => {
            const itemElements = Array.from(this.productList.getElementsByClassName('product-item'));
            this.selectedItemIndex = itemElements.indexOf(productElement);
            this.updateSelectedOrderItemUI();
        });
        
        // 在列表开头插入新商品
        const firstItem = this.productList.firstChild;
        this.productList.insertBefore(productElement, firstItem);
        this.selectedItemIndex = 0;
        this.updateSelectedOrderItemUI();
    }

    updateSelectedOrderItemUI() {
        const itemElements = this.productList.getElementsByClassName('product-item');
        const itemCount = itemElements.length;

        if (itemCount === 0) {
            this.selectedItemIndex = -1;
            return;
        }

        if (this.selectedItemIndex < 0) {
            this.selectedItemIndex = 0;
        }

        if (this.selectedItemIndex >= itemCount) {
            this.selectedItemIndex = itemCount - 1;
        }

        for (const itemElement of itemElements) {
            itemElement.classList.remove('selected-item');
        }

        const selectedItemElement = itemElements[this.selectedItemIndex];
        selectedItemElement.classList.add('selected-item');
        selectedItemElement.scrollIntoView({ block: 'nearest' });
    }

    moveSelectedOrderItem(stepValue) {
        const itemElements = this.productList.getElementsByClassName('product-item');
        if (itemElements.length === 0) {
            return;
        }

        if (this.selectedItemIndex < 0) {
            this.selectedItemIndex = 0;
        } else {
            this.selectedItemIndex += stepValue;
        }

        if (this.selectedItemIndex < 0) {
            this.selectedItemIndex = 0;
        }

        if (this.selectedItemIndex >= itemElements.length) {
            this.selectedItemIndex = itemElements.length - 1;
        }

        this.updateSelectedOrderItemUI();
    }

    removeSelectedOrderItem() {
        const itemElements = this.productList.getElementsByClassName('product-item');
        if (itemElements.length === 0) {
            return;
        }

        this.updateSelectedOrderItemUI();
        const targetItemElement = itemElements[this.selectedItemIndex];
        if (!targetItemElement) {
            return;
        }

        targetItemElement.remove();
        this.updateTotal();

        const remainItemElements = this.productList.getElementsByClassName('product-item');
        if (remainItemElements.length === 0) {
            this.selectedItemIndex = -1;
            return;
        }

        if (this.selectedItemIndex >= remainItemElements.length) {
            this.selectedItemIndex = remainItemElements.length - 1;
        }
        this.updateSelectedOrderItemUI();
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
        const totalAmountValue = this.getTotal();
        const currencySymbol = languageManager.getText('currency_symbol');

        title.textContent = this.currentPayActionKey
            ? languageManager.getText(this.currentPayActionKey)
            : languageManager.getText('payment_confirmation');
        message.textContent = `${languageManager.getText('payment_prefix')}${currencySymbol}${totalAmountValue.toFixed(2)}`;
        cancelBtn.textContent = languageManager.getText('cancel');
        confirmBtn.textContent = languageManager.getText('confirm');

        modal.style.display = 'flex';
        this.barcodeInput.disabled = true;
    }

    closePaymentModal() {
        this.paymentModal.style.display = 'none';
        this.barcodeInput.disabled = false;
        this.barcodeInput.focus();
    }

    confirmPayment() {
        this.lastOrderItems = this.getCurrentOrderItems();
        // 清空商品列表
        this.clearCurrentOrder();
        this.closePaymentModal();
        this.barcodeInput.value = '';
        this.showError(languageManager.getText('msg_payment_success'));
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
        this.fullscreenBtn.querySelector('span').textContent = this.isFullscreen
            ? languageManager.getText('exit_fullscreen')
            : languageManager.getText('enter_fullscreen');
        
        // 更新表头
        const header = document.querySelector('.product-header');
        header.children[0].textContent = languageManager.getText('product_name');
        header.children[1].textContent = languageManager.getText('price');
        header.children[2].textContent = languageManager.getText('quantity');
        header.children[3].textContent = languageManager.getText('subtotal');
        
        // 更新输入框占位符
        this.barcodeInput.placeholder = languageManager.getText('scan_barcode');
        
        // 更新模态框
        document.querySelector('#paymentModal .modal-title').textContent = this.currentPayActionKey
            ? languageManager.getText(this.currentPayActionKey)
            : languageManager.getText('payment_confirmation');
        document.querySelector('#paymentModal .modal-message').textContent = languageManager.getText('scan_payment');
        document.querySelector('#paymentModal .modal-button#cancelPayment').textContent = languageManager.getText('cancel');
        document.querySelector('#paymentModal .modal-button#confirmPayment').textContent = languageManager.getText('confirm');
        
        this.btnCancelOrder.textContent = languageManager.getText('btn_cancel_order');
        this.btnCashPay.textContent = languageManager.getText('btn_cash_pay');
        this.btnUnionPay.textContent = languageManager.getText('btn_union_pay');
        this.btnAlipay.textContent = languageManager.getText('btn_alipay');
        this.btnWechatPay.textContent = languageManager.getText('btn_wechat_pay');
        this.btnSettle.textContent = languageManager.getText('btn_settle');
        this.btnCashDrawer.textContent = languageManager.getText('btn_cash_drawer');
        this.btnReprintLast.textContent = languageManager.getText('btn_reprint_last');
        this.btnMemberCard.textContent = languageManager.getText('btn_member_card');

        // 更新总金额
        this.updateTotal();

        if (this.btnHoldOrder) {
            this.btnHoldOrder.textContent = this.isOrderHeld
                ? languageManager.getText('btn_pick_order')
                : languageManager.getText('btn_hold_order');
        }
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