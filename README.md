# AIPOS - 智能收银系统

一个基于 Python 和 Kivy 开发的现代化收银系统。

## 功能特点

- 全屏操作界面
- 支持条码扫描输入
- 多语言支持（中文/英文）
- 实时计算总价
- 美观的商品列表显示
- 支付确认功能

## 系统要求

- Python 3.7+
- Kivy 2.0+
- Windows/Linux/MacOS

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行方式

```bash
python pos_system.py
```

## 数据文件

- `products.csv`: 商品数据文件
- `languages.json`: 语言配置文件

## 使用说明

1. 扫描商品条码或手动输入商品编号
2. 系统自动显示商品信息并计算总价
3. 点击支付按钮进行结算
4. 使用语言切换器更改界面语言

## 开发说明

- 使用 Kivy 框架开发
- 支持自定义主题
- 模块化设计，易于扩展 