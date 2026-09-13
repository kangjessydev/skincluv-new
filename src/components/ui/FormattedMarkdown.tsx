// src/components/ui/FormattedMarkdown.tsx
// Comprehensive Rich Text & Markdown Engine for AI Chatbot Responses

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

  // 2. Normalize bunched numbered headings or items (e.g., "1. **Item** 2. **Item**")
  rawText = rawText.replace(/(\S)\s+(\d+\.\s+\*\*)/g, '$1\n\n$2')

  // 3. Split by double line breaks or major block delimiters
  const rawBlocks = rawText
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const renderInlineStyles = (text: string): React.ReactNode[] => {
    if (!text) return []

    // Helper regex for tokenizing bold, inline code, and precise italic
    // Bold: **text** or __text__
    // Code: `text`
    // Precise Italic: *text* (bounded by non-space)
    const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\b\*[^\s*][^*]*\*\b|(?<=\s|^|\()\*[^\s*][^*]*\*(?=\s|$|\.|,|>|!|\?|\)))/g

    const parts = text.split(tokenRegex)

    return parts.map((part, idx) => {
      if (!part) return null

      // Bold **text** or __text__
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const inner = part.slice(2, -2)
        return (
          <strong key={idx} className="fmt-bold">
            {renderInlineStyles(inner)}
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

      // Precise Italic *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
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

  const renderTableBlock = (lines: string[], key: number) => {
    // Separate header, separator, and data rows
    const dataLines = lines.filter((l) => !/^\|?\s*[-:]+[-|\s:]*$/.test(l))
    if (dataLines.length === 0) return null

    const parseRow = (rowStr: string) =>
      rowStr
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => {
          // Ignore leading/trailing empty cells from "| col1 | col2 |"
          if ((idx === 0 || idx === arr.length - 1) && cell === '') return false
          return true
        })

    const headerCells = parseRow(dataLines[0])
    const bodyRows = dataLines.slice(1).map(parseRow)

    return (
      <div key={key} className="fmt-table-wrapper">
        <table className="fmt-table">
          {headerCells.length > 0 && (
            <thead>
              <tr>
                {headerCells.map((cell, cIdx) => (
                  <th key={cIdx}>{renderInlineStyles(cell)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((rCells, rIdx) => (
              <tr key={rIdx}>
                {rCells.map((cell, cIdx) => (
                  <td key={cIdx}>{renderInlineStyles(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`formatted-markdown-root ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        // Horizontal Rule
        if (/^(---|[*]{3}|_{3})$/.test(block)) {
          return <hr key={bIdx} className="fmt-hr" />
        }

        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

        // Headings (#, ##, ###)
        if (lines.length === 1) {
          const line = lines[0]
          if (line.startsWith('### ')) {
            return (
              <h3 key={bIdx} className="fmt-h3">
                {renderInlineStyles(line.slice(4))}
              </h3>
            )
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={bIdx} className="fmt-h2">
                {renderInlineStyles(line.slice(3))}
              </h2>
            )
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={bIdx} className="fmt-h1">
                {renderInlineStyles(line.slice(2))}
              </h1>
            )
          }
        }

        // Table detection (lines starting with |)
        if (lines.length > 0 && lines.every((l) => l.startsWith('|') || l.endsWith('|'))) {
          return renderTableBlock(lines, bIdx)
        }

        // Numbered list detection
        const isNumberedBlock = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l))
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

        // Bullet list detection
        const isBulletBlock = lines.length > 0 && lines.every((l) => /^[-*]\s/.test(l))
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

        // Mixed headings inside multi-line blocks
        return (
          <div key={bIdx} className="fmt-block-group">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="fmt-h3">
                    {renderInlineStyles(line.slice(4))}
                  </h3>
                )
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={lIdx} className="fmt-h2">
                    {renderInlineStyles(line.slice(3))}
                  </h2>
                )
              }
              if (line.startsWith('# ')) {
                return (
                  <h1 key={lIdx} className="fmt-h1">
                    {renderInlineStyles(line.slice(2))}
                  </h1>
                )
              }
              if (/^(---|[*]{3}|_{3})$/.test(line)) {
                return <hr key={lIdx} className="fmt-hr" />
              }

              return (
                <p key={lIdx} className="fmt-paragraph">
                  {renderInlineStyles(line)}
                </p>
              )
            })}
          </div>
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

        .fmt-block-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fmt-h1 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f6784;
          margin: 12px 0 4px 0;
          line-height: 1.3;
        }

        .fmt-h2 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f6784;
          margin: 10px 0 4px 0;
          line-height: 1.3;
        }

        .fmt-h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #0f6784;
          margin: 8px 0 2px 0;
          line-height: 1.4;
        }

        .fmt-paragraph {
          margin: 0;
          color: #1e293b;
          line-height: 1.65;
        }

        .fmt-bold {
          font-weight: 700;
          color: #0f6784;
        }

        .fmt-italic {
          font-style: italic;
          color: #334155;
        }

        .fmt-code {
          background: #f1f5f9;
          color: #0f6784;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .fmt-hr {
          border: none;
          height: 1px;
          background: #e2e8f0;
          margin: 12px 0;
        }

        .fmt-ol, .fmt-ul {
          margin: 6px 0;
          padding-left: 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
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

        .fmt-table-wrapper {
          overflow-x: auto;
          margin: 8px 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .fmt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .fmt-table th {
          background: #eaf4fa;
          color: #0f6784;
          font-weight: 700;
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #cbd5e1;
        }

        .fmt-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .fmt-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}
