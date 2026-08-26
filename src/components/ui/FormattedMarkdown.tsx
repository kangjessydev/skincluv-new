// src/components/ui/FormattedMarkdown.tsx
// Rich Text / MS Word style Formatted Markdown Renderer for AI Chatbot responses

import React from 'react'

interface FormattedMarkdownProps {
  content: string
  userName?: string
  className?: string
}

export default function FormattedMarkdown({
  content,
  userName = 'Pengguna',
  className = '',
}: FormattedMarkdownProps) {
  if (!content) return null

  // 1. Sanitize & Replace template placeholders
  let rawText = content
    .replace(/\{\{\s*user_name\s*\}\}/gi, userName)
    .replace(/\{\{\s*name\s*\}\}/gi, userName)
    .replace(/\{\{\s*user\s*\}\}/gi, userName)

  // 2. Pre-process numbered items if bunched together on a single line (e.g. "1. **Item** text 2. **Item** text")
  rawText = rawText.replace(/(\S)\s+(\d+\.\s+\*\*)/g, '$1\n\n$2')

  // 3. Split content into block paragraphs by double linebreaks or list markers
  const blocks = rawText
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const renderInlineStyles = (text: string): React.ReactNode[] => {
    // Helper to replace **bold** and *italic*
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g)

    return parts.map((part, idx) => {
      if (!part) return null

      // Bold **text** or __text__
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const inner = part.slice(2, -2)
        return (
          <strong key={idx} className="fmt-bold">
            {inner}
          </strong>
        )
      }

      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1)
        return (
          <code key={idx} className="fmt-code">
            {inner}
          </code>
        )
      }

      // Italic *text* or _text_
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        const inner = part.slice(1, -1)
        return (
          <em key={idx} className="fmt-italic">
            {inner}
          </em>
        )
      }

      return part
    })
  }

  return (
    <div className={`formatted-markdown-root ${className}`}>
      {blocks.map((block, bIdx) => {
        // Check if block is a list item or contains linebreaks
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

        // Check if all lines start with numbers like "1. ", "2. "
        const isNumberedBlock = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l))
        // Check if lines start with bullets "- " or "* "
        const isBulletBlock = lines.length > 0 && lines.every((l) => /^[-*]\s/.test(l))

        if (isNumberedBlock) {
          return (
            <ol key={bIdx} className="fmt-ol">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\d+\.\s*/, '')
                return (
                  <li key={lIdx} className="fmt-li">
                    {renderInlineStyles(itemText)}
                  </li>
                )
              })}
            </ol>
          )
        }

        if (isBulletBlock) {
          return (
            <ul key={bIdx} className="fmt-ul">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^[-*]\s*/, '')
                return (
                  <li key={lIdx} className="fmt-li">
                    {renderInlineStyles(itemText)}
                  </li>
                )
              })}
            </ul>
          )
        }

        // Single or multi-line paragraph
        return (
          <p key={bIdx} className="fmt-paragraph">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInlineStyles(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}

      {/* RICH TEXT MS WORD CSS STYLING */}
      <style>{`
        .formatted-markdown-root {
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #1e293b;
          font-size: 0.9375rem;
          line-height: 1.7;
          word-break: break-word;
        }

        .fmt-paragraph {
          margin: 0;
          color: #1e293b;
        }

        .fmt-bold {
          font-weight: 700;
          color: #0f6784;
        }

        .fmt-italic {
          font-style: italic;
          color: #0b4f5c;
        }

        .fmt-code {
          background: #f1f5f9;
          color: #0f6784;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .fmt-ol, .fmt-ul {
          margin: 4px 0;
          padding-left: 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fmt-ol {
          list-style-type: decimal;
        }

        .fmt-ul {
          list-style-type: disc;
        }

        .fmt-li {
          color: #1e293b;
          line-height: 1.6;
        }

        .fmt-li .fmt-bold {
          display: inline;
        }
      `}</style>
    </div>
  )
}
