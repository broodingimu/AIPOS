class BarcodeParser {
    static parse(barcode) {
        if (!barcode) {
            return {
                plu: null,
                weight: null,
                amount: null,
                errorCode: 1,
                errorMessage: languageManager.getText('empty_barcode')
            };
        }

        try {
            // 根据条码长度判断类型
            if (barcode.length === 13) {  // 13位重量码
                const plu = parseInt(barcode.substring(2, 7));
                const weight = parseFloat(barcode.substring(7, 12)) / 1000;  // 转换为千克
                return { plu, weight, amount: null, errorCode: 0, errorMessage: '' };
            } 
            else if (barcode.length === 18) {  // 18位重量金额码
                const plu = parseInt(barcode.substring(2, 7));
                const weight = parseFloat(barcode.substring(7, 12)) / 1000;  // 转换为千克
                const amount = parseFloat(barcode.substring(12, 17)) / 100;  // 转换为元
                return { plu, weight, amount, errorCode: 0, errorMessage: '' };
            } 
            else if (barcode.length === 30) {  // 30位保质期码
                const plu = parseInt(barcode.substring(2, 7));
                const weight = parseFloat(barcode.substring(7, 12)) / 1000;  // 转换为千克
                const amount = parseFloat(barcode.substring(12, 17)) / 1000;  // 转换为元
                const expiryDate = barcode.substring(17, 29);  // expiry_date = 250409090210
                
                const currentTime = new Date();
                const expiryTime = new Date(
                    2000 + parseInt(expiryDate.substring(0, 2)),  // 年
                    parseInt(expiryDate.substring(2, 4)) - 1,     // 月
                    parseInt(expiryDate.substring(4, 6)),         // 日
                    parseInt(expiryDate.substring(6, 8)),         // 时
                    parseInt(expiryDate.substring(8, 10)),        // 分
                    parseInt(expiryDate.substring(10, 12))        // 秒
                );

                if ((currentTime - expiryTime) > 10000) {  // 10秒
                    return {
                        plu,
                        weight,
                        amount,
                        errorCode: 2,
                        errorMessage: languageManager.getText('expired_product')
                    };
                }

                return { plu, weight, amount, errorCode: 0, errorMessage: '' };
            } 
            else {
                // 如果长度不符合规则，尝试将整个条码作为PLU码
                const plu = parseInt(barcode);
                return { plu, weight: 1, amount: null, errorCode: 0, errorMessage: '' };
            }
        } 
        catch (e) {
            return {
                plu: null,
                weight: null,
                amount: null,
                errorCode: 3,
                errorMessage: `${languageManager.getText('invalid_barcode')}: ${e.message}`
            };
        }
    }
} 