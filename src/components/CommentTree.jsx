import { memo, useMemo } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'

function normalizeCommentText(rawHtml = '') {
  const normalized = String(rawHtml)
    .replace(/<p>/gi, '\n\n')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()

  return normalized || '(comentario sin texto)'
}

const CommentNode = memo(function CommentNode({ comment, level = 0, onLoadReplies }) {
  const isUnavailable = comment.deleted || comment.dead
  const text = useMemo(
    () => (isUnavailable ? '(comentario eliminado)' : normalizeCommentText(comment.text)),
    [isUnavailable, comment.text],
  )
  const totalReplies = Number(comment.repliesTotal ?? 0)
  const loadedReplies = Array.isArray(comment.children) ? comment.children.length : 0
  const hasMoreReplies = Boolean(comment.repliesHasMore)
  const hasAnyReplies = totalReplies > 0
  const canRequestReplies = typeof onLoadReplies === 'function' && hasMoreReplies && !comment.repliesLoading

  const nodeStyle = useMemo(
    () => ({
      pl: level > 0 ? 1.4 : 0,
      ml: level > 0 ? 0.6 : 0,
      borderLeft: level > 0 ? '2px solid #f0d7c5' : 'none',
    }),
    [level],
  )

  return (
    <Box sx={nodeStyle}>
      <Box className={`forum-comment-card ${isUnavailable ? 'is-unavailable' : ''}`}>
        <Stack spacing={0.7} sx={{ py: 1.05 }}>
          <Typography variant="body2" fontWeight={700} color="#2a2f36" className="forum-comment-author">
            {comment.by}
          </Typography>
          <Typography
            variant="body2"
            color={isUnavailable ? 'text.disabled' : 'text.primary'}
            sx={{ lineHeight: 1.6 }}
            className="forum-comment-text"
          >
            {text}
          </Typography>

          {hasAnyReplies ? (
            <Typography variant="caption" color="text.secondary" className="forum-comment-replies-count">
              Respuestas cargadas: {loadedReplies} de {totalReplies}
            </Typography>
          ) : null}

          {comment.repliesError ? (
            <Typography variant="caption" color="error.main">
              {comment.repliesError}
            </Typography>
          ) : null}

          {hasMoreReplies ? (
            <Button
              size="small"
              variant="text"
              onClick={() => onLoadReplies(comment.id)}
              disabled={!canRequestReplies}
              className="forum-comment-replies-btn"
            >
              {comment.repliesLoading
                ? 'Cargando respuestas...'
                : loadedReplies > 0
                  ? 'Ver mas respuestas'
                  : 'Ver respuestas'}
            </Button>
          ) : null}
        </Stack>
      </Box>

      {Array.isArray(comment.children) && comment.children.length > 0
        ? comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              level={level + 1}
              onLoadReplies={onLoadReplies}
            />
          ))
        : null}
    </Box>
  )
})

const CommentTree = memo(function CommentTree({ comments, onLoadReplies }) {
  const emptyMessage = useMemo(() => 'Esta historia aún no tiene comentarios.', [])

  if (!Array.isArray(comments) || comments.length === 0) {
    return (
      <Typography color="text.secondary">{emptyMessage}</Typography>
    )
  }

  return (
    <Box>
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} onLoadReplies={onLoadReplies} />
      ))}
    </Box>
  )
})

export default CommentTree
