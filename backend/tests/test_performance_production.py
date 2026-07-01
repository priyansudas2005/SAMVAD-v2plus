"""
tests/test_performance_production.py
Comprehensive test suite verifying the SAMVAD V2.0 Performance & Caching subsystem.
"""
import pytest
import time
from src.services.performance.cache import MultiLevelCache
from src.services.performance.model_manager import ModelLifecycleManager
from src.services.performance.concurrency import ConcurrencyManager
from src.services.performance.monitor import ResourceMonitor

def test_multilevel_cache_lru_and_ttl():
    cache = MultiLevelCache(namespace="test_performance")
    
    # 1. Basic put and get
    cache.set("key1", "value1", ttl=10)
    assert cache.get("key1") == "value1"
    
    # 2. TTL expiration test
    cache.set("key_expired", "expired", ttl=-1)
    assert cache.get("key_expired") is None

    # 3. LRU eviction check
    cache.max_memory_items = 2
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.set("k3", "v3") # Should evict k1
    
    stats = cache.get_stats()
    assert stats["l1_count"] <= 2

def test_model_manager_lazy_and_singleton():
    mgr = ModelLifecycleManager()
    
    # Register mock loader
    loaded_flag = False
    def mock_loader():
        nonlocal loaded_flag
        loaded_flag = True
        return "MOCK_MODEL"
        
    mgr.register_loader("mock_model", mock_loader)
    
    # Lazy load check
    assert not loaded_flag
    model = mgr.get_model("mock_model")
    assert loaded_flag
    assert model == "MOCK_MODEL"
    
    # Singleton check
    model_two = mgr.get_model("mock_model")
    assert model_two == "MOCK_MODEL"

def test_concurrency_manager_threads():
    con = ConcurrencyManager()
    
    def square(x):
        return x * x
        
    results = con.parallel_map_threads(square, [1, 2, 3, 4])
    assert results == [1, 4, 9, 16]

def test_resource_monitor():
    stats = ResourceMonitor.get_system_telemetry()
    assert "process" in stats
    assert "system" in stats
    assert "database" in stats
    assert "models" in stats
    assert stats["process"]["ram_usage_mb"] > 0
