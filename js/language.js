class LanguageManager {
    constructor() {
        this.languages = {
            '中文': {
                'language_name': '中文',
                'payment_confirmation': '支付确认',
                'scan_barcode': '请扫描条码',
                'scan_payment': '请扫码支付',
                'enter_fullscreen': '全屏',
                'exit_fullscreen': '退出全屏',
                'settings': '设置',
                'scale_ip_modal_title': '核销秤IP',
                'cancel': '取消',
                'confirm': '确认',
                'error': '错误',
                'ok': '确定',
                'total': '总计',
                'product_name': '商品名称',
                'price': '单价',
                'quantity': '数量',
                'subtotal': '小计',
                'pay': '支付',
                'expired_product': '过期商品，无法销售',
                'product_not_found': '商品不存在',
                'empty_barcode': '条码为空',
                'invalid_barcode': '条码格式错误',
                'load_products_failed': '加载商品数据失败',
                'system_init_failed': '系统初始化失败',
                'no_products_loaded': '没有加载到任何商品数据',
                'payment_prefix': '支付: ',
                'currency_symbol': '',
                'btn_cancel_order': '整单取消(C)',
                'btn_hold_order': '挂单(E)',
                'btn_pick_order': '取单(E)',
                'btn_cash_pay': '现金(F)',
                'btn_union_pay': '银联(G)',
                'btn_alipay': '支付宝(I)',
                'btn_wechat_pay': '微信(J)',
                'btn_settle': '结算(Space)',
                'btn_cash_drawer': '钱箱(M)',
                'btn_reprint_last': '重打上单(H)',
                'btn_member_card': '会员卡(L)',
                'pay_action_cash': '现金',
                'pay_action_union': '银联',
                'pay_action_alipay': '支付宝',
                'pay_action_wechat': '微信',
                'pay_action_settle': '结算',
                'pay_action_member_card': '会员卡',
                'msg_cash_drawer_opened': '钱箱弹出成功',
                'msg_no_last_order': '没有上单可重打',
                'msg_no_items_to_hold': '当前无商品可挂单',
                'msg_no_held_order': '没有挂单可取',
                'msg_no_items_to_settle': '当前无商品可结算',
                'msg_payment_success': '支付成功'
            },
            'English': {
                'language_name': 'English',
                'payment_confirmation': 'Payment Confirmation',
                'scan_barcode': 'Please scan barcode',
                'scan_payment': 'Please scan to pay',
                'enter_fullscreen': 'Fullscreen',
                'exit_fullscreen': 'Exit Fullscreen',
                'settings': 'setting',
                'scale_ip_modal_title': 'Scale IP',
                'cancel': 'Cancel',
                'confirm': 'Confirm',
                'error': 'Error',
                'ok': 'OK',
                'total': 'Total',
                'product_name': 'Product Name',
                'price': 'Price',
                'quantity': 'Qty',
                'subtotal': 'Subtotal',
                'pay': 'Pay',
                'expired_product': 'Product expired',
                'product_not_found': 'Product not found',
                'empty_barcode': 'Empty barcode',
                'invalid_barcode': 'Invalid barcode format',
                'load_products_failed': 'Failed to load product data',
                'system_init_failed': 'System initialization failed',
                'no_products_loaded': 'No product data loaded',
                'payment_prefix': 'Pay: ',
                'currency_symbol': '',
                'btn_cancel_order': 'Cancel Order (C)',
                'btn_hold_order': 'Hold (E)',
                'btn_pick_order': 'Pickup (E)',
                'btn_cash_pay': 'Cash (F)',
                'btn_union_pay': 'UnionPay (G)',
                'btn_alipay': 'Alipay (I)',
                'btn_wechat_pay': 'WeChat (J)',
                'btn_settle': 'Settle (Space)',
                'btn_cash_drawer': 'Cash Drawer (M)',
                'btn_reprint_last': 'Reprint Last (H)',
                'btn_member_card': 'Member Card (L)',
                'pay_action_cash': 'Cash',
                'pay_action_union': 'UnionPay',
                'pay_action_alipay': 'Alipay',
                'pay_action_wechat': 'WeChat',
                'pay_action_settle': 'Settle',
                'pay_action_member_card': 'Member Card',
                'msg_cash_drawer_opened': 'Cash drawer opened',
                'msg_no_last_order': 'No last order to reprint',
                'msg_no_items_to_hold': 'No items to hold',
                'msg_no_held_order': 'No held order to pickup',
                'msg_no_items_to_settle': 'No items to settle',
                'msg_payment_success': 'Payment successful'
            }
        };
        this.currentLanguage = '中文';
    }

    getText(key) {
        const languageData = this.languages[this.currentLanguage] || {};
        if (Object.prototype.hasOwnProperty.call(languageData, key)) {
            return languageData[key];
        }
        return key;
    }

    getLanguageNames() {
        return Object.values(this.languages).map(lang => lang.language_name);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getCurrentLanguageName() {
        return this.languages[this.currentLanguage].language_name;
    }

    setLanguage(languageName) {
        if (this.languages[languageName]) {
            this.currentLanguage = languageName;
            return true;
        }
        return false;
    }

    getLanguageData() {
        return this.languages[this.currentLanguage];
    }
}

// 创建全局语言管理器实例
const languageManager = new LanguageManager(); 