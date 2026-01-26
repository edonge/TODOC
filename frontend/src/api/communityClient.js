import { apiFetch } from './base';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 댓글 목록 조회
export async function getComments(postId) {
  const res = await apiFetch(`/api/community/posts/${postId}/comments`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '댓글 조회 실패');
  }
  return res.json();
}

// 댓글 작성
export async function createComment(postId, content, parentId = null) {
  const body = { content };
  if (parentId) {
    body.parent_id = parentId;
  }

  const res = await apiFetch(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '댓글 작성 실패');
  }
  return res.json();
}

// 댓글 삭제
export async function deleteComment(commentId) {
  const res = await apiFetch(`/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '댓글 삭제 실패');
  }
  return true;
}

// 게시글 상세 조회
export async function getPost(postId) {
  const res = await apiFetch(`/api/community/posts/${postId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '게시글 조회 실패');
  }
  return res.json();
}

// 게시글 좋아요 토글
export async function togglePostLike(postId) {
  const res = await apiFetch(`/api/community/posts/${postId}/like`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '좋아요 실패');
  }
  return res.json();
}
