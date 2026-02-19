from pathlib import Path
from typing import List, Optional

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

from app.core.config import settings

_embeddings = None


def _get_embeddings() -> OpenAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    return _embeddings


def _load_single_store(pkl_path: Path) -> Optional[FAISS]:
    if not pkl_path.exists():
        return None
    faiss_path = pkl_path.with_suffix(".faiss")
    if not faiss_path.exists():
        return None
    return FAISS.load_local(
        folder_path=str(pkl_path.parent),
        index_name=pkl_path.stem,
        embeddings=_get_embeddings(),
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
