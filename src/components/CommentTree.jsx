import { memo, useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'

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

const CommentNode = memo(function CommentNode({ comment, level = 0 }) {
  const isUnavailable = comment.deleted || comment.dead
  const text = useMemo(
    () => (isUnavailable ? '(comentario eliminado)' : normalizeCommentText(comment.text)),
    [isUnavailable, comment.text],
  )

  const nodeStyle = useMemo(
    () => ({
      pl: level > 0 ? 2 : 0,
      ml: level > 0 ? 1 : 0,
      borderLeft: level > 0 ? '2px solid #f0d7c5' : 'none',
    }),
    [level],
  )

  return (
    <Box sx={nodeStyle}>
      <Stack spacing={0.5} sx={{ py: 1.25 }}>
        <Typography variant="body2" fontWeight={700} color="#2a2f36">
          {comment.by}
        </Typography>
        <Typography
          variant="body2"
          color={isUnavailable ? 'text.disabled' : 'text.primary'}
          sx={{ lineHeight: 1.55 }}
        >
          {text}
        </Typography>
      </Stack>

      {Array.isArray(comment.children) && comment.children.length > 0
        ? comment.children.map((child) => (
            <CommentNode key={child.id} comment={child} level={level + 1} />
          ))
        : null}
    </Box>
  )
})

const CommentTree = memo(function CommentTree({ comments }) {
  const emptyMessage = useMemo(() => 'Esta historia aún no tiene comentarios.', [])

  if (!Array.isArray(comments) || comments.length === 0) {
    return (
      <Typography color="text.secondary">{emptyMessage}</Typography>
    )
  }

  return (
    <Box>
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} />
      ))}
    </Box>
  )
})

export default CommentTree
