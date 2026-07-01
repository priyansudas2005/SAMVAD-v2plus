"""
cache.py
Multi-level (L1 Memory / L2 Disk) Cache System for SAMVAD V2.0.
Supports TTL expiration, LRU evictions, and maximum storage bounds.
"""
import time
import pickle
import hashlib
from collections import OrderedDict
from pathlib import Path
from typing import Any, Optional, Dict

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

class MultiLevelCache:
    """
    Combines in-memory L1 LRU caching with on-disk L2 persistent caching.
    """

    def __init__(self, namespace: str) -> None:
        self.namespace = namespace
        cfg = load_config()
        perf = cfg.get("performance", {})
        cache_cfg = perf.get("cache", {})
        
        self.max_memory_items = cache_cfg.get("l1_max_memory_mb", 256) # simple threshold of items
        self.ttl = cache_cfg.get("ttl_seconds", 3600)
        
        self.l1_cache: OrderedDict[str, tuple] = OrderedDict() # key -> (val, expire_time)
        self.l2_dir = Path("backend/data/cache") / namespace
        self.l2_dir.mkdir(parents=True, exist_ok=True)
        
        # Stats tracking
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Gets value from L1 or L2 disk cache if TTL is valid."""
        hashed_key = hashlib.sha256(key.encode("utf-8")).hexdigest()
        now = time.time()

        # 1. Look up in L1 Cache
        if hashed_key in self.l1_cache:
            val, expire = self.l1_cache[hashed_key]
            if expire > now:
                self.l1_cache.move_to_end(hashed_key)
                self.hits += 1
                return val
            else:
                # Expired
                del self.l1_cache[hashed_key]

        # 2. Look up in L2 Cache (Disk)
        l2_path = self.l2_dir / hashed_key
        if l2_path.exists():
            try:
                with open(l2_path, "rb") as f:
                    val, expire = pickle.load(f)
                if expire > now:
                    # Promote back to L1
                    self._set_l1(hashed_key, val, expire)
                    self.hits += 1
                    return val
                else:
                    # Expired disk item
                    l2_path.unlink()
            except Exception:
                pass

        self.misses += 1
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Sets value in both L1 memory and L2 disk caches."""
        hashed_key = hashlib.sha256(key.encode("utf-8")).hexdigest()
        expire = time.time() + (ttl if ttl is not None else self.ttl)

        # Write to L1
        self._set_l1(hashed_key, value, expire)

        # Write to L2 (Disk)
        l2_path = self.l2_dir / hashed_key
        try:
            with open(l2_path, "wb") as f:
                pickle.dump((value, expire), f)
        except Exception as e:
            logger.warning(f"Failed to persist cache key to disk: {e}")

    def _set_l1(self, hashed_key: str, value: Any, expire: float) -> None:
        if len(self.l1_cache) >= self.max_memory_items:
            # Evict LRU item (first item in OrderedDict)
            self.l1_cache.popitem(last=False)
        self.l1_cache[hashed_key] = (value, expire)

    def cleanup(self) -> None:
        """Removes expired items from memory and disk."""
        now = time.time()
        
        # Cleanup L1
        expired_l1 = [k for k, (_, exp) in self.l1_cache.items() if exp <= now]
        for k in expired_l1:
            del self.l1_cache[k]
            
        # Cleanup L2
        for f in self.l2_dir.glob("*"):
            try:
                with open(f, "rb") as fh:
                    _, exp = pickle.load(fh)
                if exp <= now:
                    f.unlink()
            except Exception:
                pass

    def get_stats(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio": (self.hits / (self.hits + self.misses)) if (self.hits + self.misses) > 0 else 0.0,
            "l1_count": len(self.l1_cache)
        }
