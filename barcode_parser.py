from language_manager import LanguageManager

def parse_barcode(barcode):
    """
    根据条码位数判断类型并解析
    
    Args:
        barcode (str): 输入的条码字符串
        
    Returns:
        tuple: (plu, weight, amount, error_code, error_message)
            - plu: 商品PLU码
            - weight: 商品重量（千克）
            - amount: 商品金额（元），如果条码中没有金额信息则为None
            - error_code: 错误代码，0表示成功，非0表示错误
            - error_message: 错误信息，成功时为空字符串
    """
    if not barcode:
        return None, None, None, 1, "条码为空"

    try:
        # 根据条码长度判断类型
        if len(barcode) == 13:  # 13位重量码
            plu = int(barcode[2:7])
            weight = float(barcode[7:12]) / 1000  # 转换为千克
            return plu, weight, None, 0, ""
        elif len(barcode) == 18:  # 18位重量金额码
            plu = int(barcode[2:7])
            weight = float(barcode[7:12]) / 1000  # 转换为千克
            amount = float(barcode[12:17]) / 100  # 转换为元
            return plu, weight, amount, 0, ""
        elif len(barcode) == 30:  # 30位保质期码 年月日时分秒 210100112345123452504090902101
            plu = int(barcode[2:7])  # plu = 1001
            weight = float(barcode[7:12]) / 1000  # weight = 1.2345 kg
            amount = float(barcode[12:17]) / 1000  # amount = 12.345 元
            expiry_date = barcode[17:29]  # expiry_date = 250409090210
            
            from datetime import datetime
            current_time = datetime.now()
            try:
                expiry_time = datetime.strptime(expiry_date, '%y%m%d%H%M%S')
                if (current_time - expiry_time).total_seconds() > 10:
                    # 使用语言管理器获取错误消息
                    lang_manager = LanguageManager()
                    error_message = lang_manager.get_text('expired_product')
                    return plu, weight, amount, 2, error_message
            except ValueError as e:
                return plu, weight, amount, 3, f"日期格式错误: {str(e)}"
            return plu, weight, amount, 0, ""
        else:
            # 如果长度不符合规则，尝试将整个条码作为PLU码
            plu = int(barcode)
            return plu, 1, None, 0, ""
    except (ValueError, IndexError) as e:
        return None, None, None, 3, f"条码格式错误: {str(e)}" 