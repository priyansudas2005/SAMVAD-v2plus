"""
concurrency.py
ThreadPool and ProcessPool managers implementing concurrency for CPU/IO tasks.
Handles parallelization of audio stages, extractions, and document rendering.
"""
import concurrent.futures
from typing import List, Callable, Any, TypeVar

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

T = TypeVar('T')
R = TypeVar('R')

class ConcurrencyManager:
    """
    Manages global thread pools and process pools for parallel execution of CPU/IO tasks.
    """
    _instance = None
    _lock = threading_lock = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConcurrencyManager, cls).__new__(cls)
            cls._instance._init_pools()
        return cls._instance

    def _init_pools(self) -> None:
        cfg = load_config()
        con_cfg = cfg.get("performance", {}).get("concurrency", {})
        
        self.thread_workers = con_cfg.get("thread_pool_size", 4)
        self.process_workers = con_cfg.get("process_pool_size", 2)
        
        self.thread_executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.thread_workers,
            thread_name_prefix="samvad_thread_pool"
        )
        # Process executor is lazily allocated to save startup memory on light systems
        self.process_executor = None

    def get_process_executor(self) -> concurrent.futures.ProcessPoolExecutor:
        """Lazily builds the ProcessPoolExecutor."""
        if self.process_executor is None:
            self.process_executor = concurrent.futures.ProcessPoolExecutor(
                max_workers=self.process_workers
            )
        return self.process_executor

    def parallel_map_threads(self, fn: Callable[[T], R], items: List[T]) -> List[R]:
        """Runs a function over multiple items in parallel using ThreadPoolExecutor."""
        if not items:
            return []
        
        futures = [self.thread_executor.submit(fn, item) for item in items]
        concurrent.futures.wait(futures)
        return [f.result() for f in futures]

    def parallel_map_processes(self, fn: Callable[[T], R], items: List[T]) -> List[R]:
        """Runs a function over multiple items in parallel using ProcessPoolExecutor."""
        if not items:
            return []
        
        executor = self.get_process_executor()
        futures = [executor.submit(fn, item) for item in items]
        concurrent.futures.wait(futures)
        return [f.result() for f in futures]

    def shutdown(self) -> None:
        """Closes active thread/process pools."""
        self.thread_executor.shutdown(wait=True)
        if self.process_executor:
            self.process_executor.shutdown(wait=True)
