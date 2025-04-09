class LanguageManager {
    constructor() {
        this.languages = {
            '中文': {
                'language_name': '中文',
                'payment_confirmation': '支付确认',
                'scan_barcode': '请扫描条码',
                'scan_payment': '请扫码支付',
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
                'empty_barcode': '条码为空',
                'invalid_barcode': '条码格式错误',
                'payment_prefix': '支付: ',
                'currency_symbol': '¥'
            },
            'English': {
                'language_name': 'English',
                'payment_confirmation': 'Payment Confirmation',
                'scan_barcode': 'Please scan barcode',
                'scan_payment': 'Please scan to pay',
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
                'empty_barcode': 'Empty barcode',
                'invalid_barcode': 'Invalid barcode format',
                'payment_prefix': 'Pay: ',
                'currency_symbol': '$'
            }
        };
        this.currentLanguage = '中文';
    }

    getText(key) {
        return this.languages[this.currentLanguage][key] || key;
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