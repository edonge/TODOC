from pathlib import Path
from typing import List, Optional

from langchain_community.vectorstores import FAISS


def _load_single_store(pkl_path: Path) -> Optional[FAISS]:
    if not pkl_path.exists():
        return None
    # pkl 파일은 FAISS 저장본. dangerous_deserialization 필요.
    return FAISS.load_local(
        pkl_path.with_suffix(""),
        allow_dangerous_deserialization=True,
    )


def load_faiss_from_dir(dir_path: Path) -> Optional[FAISS]:
    if not dir_path.exists():
        return None
    stores = []
    for pkl in dir_path.glob("*.pkl"):
        store = _load_single_store(pkl)
        if store:
            stores.append(store)
    if not stores:
        return None
    base = stores[0]
    for other in stores[1:]:
        base.merge_from(other)
    return base


def load_mode_stores(base_dir: Path, folders: List[str]):
    stores = []
    for name in folders:
        store = load_faiss_from_dir(base_dir / name)
        if store:
            stores.append(store)
    if not stores:
        return None
    base = stores[0]
    for other in stores[1:]:
        base.merge_from(other)
    return base.as_retriever(search_kwargs={"k": 4})
