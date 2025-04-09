import json
from typing import Dict, Any

class LanguageManager:
    _instance = None
    _languages: Dict[str, Dict[str, str]] = {}
    _current_language: str = 'zh_CN'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LanguageManager, cls).__new__(cls)
            cls._instance._load_languages()
        return cls._instance

    def _load_languages(self):
        """加载语言文件"""
        try:
            with open('languages.json', 'r', encoding='utf-8') as f:
                self._languages = json.load(f)
        except Exception as e:
            print(f"Error loading languages: {e}")
            self._languages = {}

    def get_text(self, key: str) -> str:
        """获取当前语言下的文本"""
        return self._languages.get(self._current_language, {}).get(key, key)

    def get_language_names(self) -> list:
        """获取所有可用的语言名称列表"""
        return [lang_data['language_name'] for lang_data in self._languages.values()]

    def get_current_language(self) -> str:
        """获取当前语言代码"""
        return self._current_language

    def get_current_language_name(self) -> str:
        """获取当前语言的显示名称"""
        return self._languages.get(self._current_language, {}).get('language_name', 'Unknown')

    def set_language(self, language_name: str) -> bool:
        """设置当前语言
        
        Args:
            language_name: 语言的显示名称（如"中文"或"English"）
            
        Returns:
            bool: 是否设置成功
        """
        for lang_code, lang_data in self._languages.items():
            if lang_data['language_name'] == language_name:
                self._current_language = lang_code
                return True
        return False

    def get_language_data(self) -> Dict[str, Any]:
        """获取当前语言的所有翻译数据"""
        return self._languages.get(self._current_language, {}) 