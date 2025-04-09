import kivy
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.core.window import Window
from kivy.uix.spinner import Spinner, SpinnerOption
import json
import csv
from kivy.properties import StringProperty, NumericProperty
from kivy.clock import Clock
from kivy.core.text import LabelBase
from kivy.resources import resource_add_path
import os
from kivy.graphics import Color, Rectangle, Line
from kivy.uix.popup import Popup
from barcode_parser import parse_barcode
from language_manager import LanguageManager

# 设置全屏
Window.fullscreen = 'auto'

# 添加系统字体路径
if os.name == 'nt':  # Windows系统
    resource_add_path('C:/Windows/Fonts')
    LabelBase.register('SimHei', 'simhei.ttf')
    LabelBase.register('SimSun', 'simsun.ttc')
    LabelBase.register('Microsoft YaHei', 'msyh.ttc')
    FONT_NAME = 'Microsoft YaHei'  # 使用微软雅黑
else:  # Linux/Mac系统
    resource_add_path('/usr/share/fonts')
    LabelBase.register('SimHei', 'SimHei.ttf')
    FONT_NAME = 'SimHei'

# 在文件开头添加字号常量
TITLE_FONT_SIZE = '36sp'  # 标题字号
HEADER_FONT_SIZE = '24sp'  # 表头字号
LIST_FONT_SIZE = '20sp'  # 列表字号
BUTTON_FONT_SIZE = '24sp'  # 按钮字号
POPUP_FONT_SIZE = '32sp'  # 弹窗提示字号

class CustomSpinnerOption(SpinnerOption):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.font_name = FONT_NAME
        self.font_size = LIST_FONT_SIZE
        self.background_color = (0.2, 0.2, 0.2, 1)
        self.color = (1, 1, 1, 1)
        self.height = 60

class ProductItem(BoxLayout):
    name = StringProperty('')
    price = NumericProperty(0)
    quantity = NumericProperty(0)
    subtotal = NumericProperty(0)
    unit = StringProperty('')
    is_last_item = False  # 新增属性标记是否为最后一个商品项

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'horizontal'
        self.size_hint_y = None
        self.height = 60
        self.padding = [5, 0, 20, 0]  # 减小左边距，增加右边距
        self.spacing = 0  # 移除间距
        # 添加背景色和边框
        with self.canvas.before:
            # 添加深灰色背景
            Color(0.3, 0.3, 0.3, 1)  # 深灰色背景，比表头稍浅
            Rectangle(pos=self.pos, size=self.size)
            # 添加边框
            Color(0.85, 0.85, 0.85, 1)  # 更柔和的灰色边框
            # 绘制左右边框和上边框
            # 上边框
            Line(points=[self.x, self.y + self.height, self.x + self.width, self.y + self.height], width=1)
            # 左边框
            Line(points=[self.x, self.y, self.x, self.y + self.height], width=1)
            # 右边框
            Line(points=[self.x + self.width, self.y, self.x + self.width, self.y + self.height], width=1)
            # 如果是最后一个商品项，绘制下边框
            if self.is_last_item:
                Line(points=[self.x, self.y, self.x + self.width, self.y], width=1)
                
            # 移除竖线分隔符
        self.bind(pos=self._update_border, size=self._update_border)

        # 商品名称（左对齐）
        self.name_label = Label(
            text=self.name,
            size_hint_x=0.4,  # 保持商品名称宽度不变
            font_name=FONT_NAME,
            font_size=LIST_FONT_SIZE,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            text_size=(300, 60),
            padding_x=5
        )
        self.add_widget(self.name_label)

        # 单价（左对齐）
        self.price_label = Label(
            text=str(self.price),
            size_hint_x=0.1,  # 保持单价宽度不变
            font_name=FONT_NAME,
            font_size=LIST_FONT_SIZE,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            text_size=(200, 60),
            padding_x=5
        )
        self.add_widget(self.price_label)

        # 数量（左对齐）
        self.quantity_label = Label(
            text=str(self.quantity),
            size_hint_x=0.1,  # 增加数量宽度到10%
            font_name=FONT_NAME,
            font_size=LIST_FONT_SIZE,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            text_size=(200, 60),
            padding_x=5
        )
        self.add_widget(self.quantity_label)

        # 小计（左对齐）
        self.subtotal_label = Label(
            text=str(self.subtotal),
            size_hint_x=0.4,  # 增加小计宽度
            font_name=FONT_NAME,
            font_size=LIST_FONT_SIZE,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            text_size=(200, 60),
            padding_x=5
        )
        self.add_widget(self.subtotal_label)

        # 绑定尺寸变化事件
        self.bind(size=self._update_labels_size)

    def _update_border(self, instance, value):
        """更新边框的位置和大小"""
        # 清除旧的边框和背景
        self.canvas.before.clear()
        # 重新绘制背景和边框
        with self.canvas.before:
            # 添加深灰色背景
            Color(0.3, 0.3, 0.3, 1)  # 深灰色背景，比表头稍浅
            Rectangle(pos=instance.pos, size=instance.size)
            # 添加边框
            Color(0.85, 0.85, 0.85, 1)  # 更柔和的灰色边框
            # 绘制左右边框和上边框
            # 上边框
            Line(points=[instance.x, instance.y + instance.height, instance.x + instance.width, instance.y + instance.height], width=1)
            # 左边框
            Line(points=[instance.x, instance.y, instance.x, instance.y + instance.height], width=1)
            # 右边框
            Line(points=[instance.x + instance.width, instance.y, instance.x + instance.width, instance.y + instance.height], width=1)
            # 如果是最后一个商品项，绘制下边框
            if self.is_last_item:
                Line(points=[instance.x, instance.y, instance.x + instance.width, instance.y], width=1)
                
            # 移除竖线分隔符

    def _update_labels_size(self, instance, value):
        """更新所有标签的文本尺寸"""
        # 计算每个标签的实际宽度，不考虑padding和spacing
        total_width = self.width
        name_width = total_width * 0.4
        price_width = total_width * 0.1
        quantity_width = total_width * 0.1
        subtotal_width = total_width * 0.4

        # 更新每个标签的text_size
        self.name_label.text_size = (name_width, self.height)
        self.price_label.text_size = (price_width, self.height)
        self.quantity_label.text_size = (quantity_width, self.height)
        self.subtotal_label.text_size = (subtotal_width, self.height)

    def update_labels(self):
        self.name_label.text = self.name
        self.price_label.text = str(self.price)
        self.quantity_label.text = str(self.quantity)
        self.subtotal_label.text = str(self.subtotal)

class PaymentPopup(Popup):
    def __init__(self, pos_system, **kwargs):
        super().__init__(**kwargs)
        self.pos_system = pos_system
        self.title = self.pos_system.lang_manager.get_text('payment_confirmation')
        self.title_font = FONT_NAME
        self.title_size = HEADER_FONT_SIZE
        self.size_hint = (0.4, 0.3)
        
        # 创建内容布局
        content = BoxLayout(orientation='vertical', padding=10, spacing=10)
        
        # 添加提示文本
        message = Label(
            text=self.pos_system.lang_manager.get_text('scan_barcode'),
            font_name=FONT_NAME,
            font_size=POPUP_FONT_SIZE,
            size_hint_y=0.6,
            color=(1, 1, 1, 1),
            bold=True
        )
        content.add_widget(message)
        
        # 创建按钮布局
        button_layout = BoxLayout(orientation='horizontal', spacing=10, size_hint_y=0.4)
        
        # 取消按钮
        cancel_button = Button(
            text=self.pos_system.lang_manager.get_text('cancel'),
            font_name=FONT_NAME,
            font_size=BUTTON_FONT_SIZE,
            background_color=(0.8, 0.8, 0.8, 1),
            color=(0, 0, 0, 1)
        )
        cancel_button.bind(on_press=self.dismiss)
        button_layout.add_widget(cancel_button)
        
        # 确认按钮
        confirm_button = Button(
            text=self.pos_system.lang_manager.get_text('confirm'),
            font_name=FONT_NAME,
            font_size=BUTTON_FONT_SIZE,
            background_color=(0.2, 0.6, 1, 1),
            color=(1, 1, 1, 1)
        )
        confirm_button.bind(on_press=self.confirm_payment)
        button_layout.add_widget(confirm_button)
        
        content.add_widget(button_layout)
        self.content = content

    def confirm_payment(self, instance):
        # 清空商品列表
        self.pos_system.product_list.clear_widgets()
        self.pos_system.update_total()
        self.dismiss()

class POSSystem(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.padding = 10
        self.spacing = 10

        # 初始化语言管理器
        self.lang_manager = LanguageManager()
        
        # 顶部布局
        self.top_layout = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=80
        )
        
        # 左上角标题
        self.title_label = Label(
            text='AIPOS',
            size_hint_x=0.5,
            font_name=FONT_NAME,
            font_size=TITLE_FONT_SIZE,
            bold=True
        )
        self.top_layout.add_widget(self.title_label)

        # 语言选择器
        self.language_spinner = Spinner(
            text=self.lang_manager.get_current_language_name(),
            values=self.lang_manager.get_language_names(),
            size_hint=(None, None),
            size=(150, 60),
            pos_hint={'right': 0.98, 'top': 0.98},
            font_name=FONT_NAME,
            font_size=BUTTON_FONT_SIZE,
            option_cls=CustomSpinnerOption,
            background_color=(0.2, 0.2, 0.2, 1),
            color=(1, 1, 1, 1)
        )
        self.language_spinner.bind(text=self.on_language_change)
        self.top_layout.add_widget(self.language_spinner)
        
        self.add_widget(self.top_layout)

        # 商品列表标题
        self.header = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=60,
            padding=[5, 0, 20, 0],  # 减小左边距，增加右边距
            spacing=0
        )
        
        # 为表头添加背景色和细边框
        with self.header.canvas.before:
            # 添加深灰色背景
            Color(0.2, 0.2, 0.2, 1)  # 深灰色背景
            Rectangle(pos=self.header.pos, size=self.header.size)
            # 添加边框
            Color(0.75, 0.75, 0.75, 1)  # 稍深的灰色边框
            Line(points=[self.header.x, self.header.y + self.header.height, 
                        self.header.x + self.header.width, self.header.y + self.header.height], width=1)  # 上边框
            Line(points=[self.header.x, self.header.y, 
                        self.header.x + self.header.width, self.header.y], width=1)  # 下边框
            Line(points=[self.header.x, self.header.y, 
                        self.header.x, self.header.y + self.header.height], width=1)  # 左边框
            Line(points=[self.header.x + self.header.width, self.header.y, 
                        self.header.x + self.header.width, self.header.y + self.header.height], width=1)  # 右边框
            
            # 移除竖线分隔符

        # 绑定位置和尺寸变化事件
        self.header.bind(pos=self._update_header_border, size=self._update_header_border)

        # 直接添加标签
        self.name_header = Label(
            text='商品名称',
            size_hint_x=0.4,  # 保持商品名称宽度不变
            font_name=FONT_NAME,
            font_size=HEADER_FONT_SIZE,
            bold=True,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            padding_x=5
        )
        self.name_header.bind(size=lambda *x: setattr(self.name_header, 'text_size', self.name_header.size))
        self.header.add_widget(self.name_header)

        self.price_header = Label(
            text='单价',
            size_hint_x=0.1,  # 保持单价宽度不变
            font_name=FONT_NAME,
            font_size=HEADER_FONT_SIZE,
            bold=True,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            padding_x=5
        )
        self.price_header.bind(size=lambda *x: setattr(self.price_header, 'text_size', self.price_header.size))
        self.header.add_widget(self.price_header)

        self.quantity_header = Label(
            text=self.lang_manager.get_text('quantity'),  # 从语言文件获取
            size_hint_x=0.1,  # 增加数量宽度到10%
            font_name=FONT_NAME,
            font_size=HEADER_FONT_SIZE,
            bold=True,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            padding_x=5
        )
        self.quantity_header.bind(size=lambda *x: setattr(self.quantity_header, 'text_size', self.quantity_header.size))
        self.header.add_widget(self.quantity_header)

        self.subtotal_header = Label(
            text='小计',
            size_hint_x=0.4,  # 增加小计宽度
            font_name=FONT_NAME,
            font_size=HEADER_FONT_SIZE,
            bold=True,
            color=(1, 1, 1, 1),
            halign='left',
            valign='middle',
            padding_x=5
        )
        self.subtotal_header.bind(size=lambda *x: setattr(self.subtotal_header, 'text_size', self.subtotal_header.size))
        self.header.add_widget(self.subtotal_header)

        self.add_widget(self.header)

        # 商品列表
        self.product_list = BoxLayout(
            orientation='vertical',
            spacing=0,
            size_hint_y=None
        )
        self.product_list.bind(minimum_height=self.product_list.setter('height'))
        
        # 修改ScrollView的布局方式，设置do_scroll_y=True确保可以垂直滚动
        self.scroll_view = ScrollView(
            size_hint=(1, 0.7),
            do_scroll_y=True,
            scroll_y=1,
            effect_cls='ScrollEffect'  # 使用更流畅的滚动效果
        )
        self.scroll_view.add_widget(self.product_list)
        self.add_widget(self.scroll_view)

        # 错误提示标签（使用相对布局使其位于中心）
        self.error_label = Label(
            text='',
            size_hint=(None, None),
            size=(800, 100),
            font_name=FONT_NAME,
            font_size=POPUP_FONT_SIZE,
            color=(1, 0, 0, 1),
            opacity=0,
            bold=True
        )
        # 将错误标签放置在窗口中心
        self.error_label.bind(
            size=lambda *x: setattr(self.error_label, 'center_x', self.center_x),
            pos=lambda *x: setattr(self.error_label, 'center_y', self.center_y)
        )
        self.add_widget(self.error_label)

        # 底部输入区域
        self.bottom_layout = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=80,
            spacing=10
        )

        # 条码输入框（隐藏但保留用于显示当前输入）
        self.barcode_input = TextInput(
            multiline=False,
            size_hint_x=0.7,
            font_name=FONT_NAME,
            font_size=LIST_FONT_SIZE,
            opacity=1  # 完全可见
        )
        self.bottom_layout.add_widget(self.barcode_input)

        # 支付按钮（显示合计金额）
        self.pay_button = Button(
            text='支付: ¥0.00',
            size_hint_x=0.3,
            font_name=FONT_NAME,
            font_size=BUTTON_FONT_SIZE
        )
        self.pay_button.bind(on_press=self.on_pay)
        self.bottom_layout.add_widget(self.pay_button)

        self.add_widget(self.bottom_layout)

        # 加载商品数据
        self.products = {}
        self.load_products()
        
        # 当前总计金额
        self.current_total = 0.0
        
        # 全局输入缓冲区
        self.current_input = ''
        
        # 绑定全局键盘事件
        Window.bind(on_keyboard=self.on_keyboard)

    def on_keyboard(self, window, key, scancode, codepoint, modifier):
        """处理全局键盘输入"""
        if key in [48, 49, 50, 51, 52, 53, 54, 55, 56, 57]:  # 数字键 0-9
            self.current_input += str(key - 48)
            self.barcode_input.text = self.current_input  # 更新输入框显示
            return True
        elif key == 8:  # 退格键
            if self.current_input:
                self.current_input = self.current_input[:-1]
                self.barcode_input.text = self.current_input  # 更新输入框显示
            return True
        elif key == 13:  # 回车键
            if self.current_input:
                self.add_product(self.current_input)
                self.current_input = ''
                self.barcode_input.text = ''  # 清空输入框显示
            return True
        return False

    def load_products(self):
        try:
            with open('products.csv', 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.products[int(row['plu'])] = {
                        'name': row['name'],
                        'price': float(row['price']),
                        'unit': row['unit']
                    }
        except Exception as e:
            print(f"Error loading products: {e}")

    def add_product(self, barcode):
        # 尝试解析生鲜码
        parsed_plu, parsed_weight, parsed_amount, error_code, error_message = parse_barcode(barcode)
        if error_code != 0:
            # 如果是超期商品错误，使用当前语言的错误消息
            if error_code == 2:
                error_message = self.lang_manager.get_text('expired_product')
            self.show_error(f"{error_message}")
            return None, None, None
        
        # 根据解析结果设置变量
        if parsed_plu is not None:
            # 解析成功：使用解析出的PLU查询，使用解析出的重量和金额
            query_plu = parsed_plu
            weight = parsed_weight
            amount = parsed_amount
        else:
            # 解析失败：使用原始条码查询，重量为1，金额为商品单价
            query_plu = int(barcode)
            weight = 1
            amount = None  # 将在找到商品后设置为商品单价

        # 查询商品
        if query_plu in self.products:
            product = self.products[query_plu]
            
            # 创建新商品项
            item = ProductItem()
            item.name = product['name']
            item.price = product['price']
            item.quantity = weight
            item.subtotal = amount if amount is not None else (item.price * item.quantity)
            item.unit = product['unit']
            item.update_labels()
            
            # 将新项添加到列表底部
            self.product_list.add_widget(item)
            
            # 重新排序所有商品项
            items = [child for child in self.product_list.children if isinstance(child, ProductItem)]
            self.product_list.clear_widgets()  # 清空列表
            
            # 倒序添加所有商品项
            for i, item in enumerate(items):
                item.is_last_item = (i == 0)  # 第一个添加的是最后一个商品项
                item._update_border(item, None)
                self.product_list.add_widget(item)
            
            self.update_total()
        else:
            # 商品不存在时显示提示
            lang_data = self.lang_manager.get_text()
            self.show_error(f"{lang_data['product_not_found']} ({query_plu})")

    def show_error(self, message):
        # 显示错误信息
        self.error_label.text = message
        self.error_label.opacity = 1
        # 确保错误标签位于中心
        self.error_label.center_x = self.center_x
        self.error_label.center_y = self.center_y
        # 3秒后隐藏
        Clock.schedule_once(lambda dt: setattr(self.error_label, 'opacity', 0), 3)

    def update_total(self):
        # 注意：由于布局变化，children的顺序也变了，但不影响计算总价
        total = sum(child.subtotal for child in self.product_list.children 
                   if isinstance(child, ProductItem))
        self.current_total = total
        self.pay_button.text = f"{self.lang_manager.get_text('pay')}: {self.lang_manager.get_text('currency_symbol')}{total:.2f}"

    def on_pay(self, instance):
        # 显示支付确认弹窗
        popup = PaymentPopup(self)
        popup.open()
    
    def on_language_change(self, instance, value):
        # 更新界面语言
        if self.lang_manager.set_language(value):
            self.update_ui_language()

    def _update_header_border(self, instance, value):
        """更新表头边框的位置和大小"""
        # 清除旧的边框和背景
        instance.canvas.before.clear()
        # 重新绘制背景和边框
        with instance.canvas.before:
            # 添加深灰色背景
            Color(0.2, 0.2, 0.2, 1)  # 深灰色背景
            Rectangle(pos=instance.pos, size=instance.size)
            # 添加边框
            Color(0.75, 0.75, 0.75, 1)  # 稍深的灰色边框
            Line(points=[instance.x, instance.y + instance.height, 
                        instance.x + instance.width, instance.y + instance.height], width=1)  # 上边框
            Line(points=[instance.x, instance.y, 
                        instance.x + instance.width, instance.y], width=1)  # 下边框
            Line(points=[instance.x, instance.y, 
                        instance.x, instance.y + instance.height], width=1)  # 左边框
            Line(points=[instance.x + instance.width, instance.y, 
                        instance.x + instance.width, instance.y + instance.height], width=1)  # 右边框
            
            # 移除竖线分隔符

    def update_ui_language(self):
        # 更新界面文本
        self.pay_button.text = f"{self.lang_manager.get_text('pay')}: {self.lang_manager.get_text('currency_symbol')}{self.current_total:.2f}"
        
        # 更新表头
        self.name_header.text = self.lang_manager.get_text('product_name')
        self.price_header.text = self.lang_manager.get_text('price')
        self.quantity_header.text = self.lang_manager.get_text('quantity')
        self.subtotal_header.text = self.lang_manager.get_text('subtotal')

class POSApp(App):
    def build(self):
        return POSSystem()

if __name__ == '__main__':
    POSApp().run() 