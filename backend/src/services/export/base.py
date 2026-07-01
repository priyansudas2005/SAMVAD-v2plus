"""
base.py
Abstract base class for all SAMVAD V2.0 export formats.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseExporter(ABC):
    """
    Abstract base interface defining the contract for all document exporters.
    """

    @abstractmethod
    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> Any:
        """
        Exports meeting details into the targeted format.
        """
        pass
