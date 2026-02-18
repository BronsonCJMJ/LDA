import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontSize } from '@tiptap/extension-text-style'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

const MenuButton = ({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode
}) => (
  <button
    type="button"
    className={`rte-btn${active ? ' rte-btn-active' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
)

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px']

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextStyle,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when editing a different article)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar">
        <MenuButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <strong>B</strong>
        </MenuButton>
        <MenuButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <em>I</em>
        </MenuButton>
        <MenuButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </MenuButton>
        <MenuButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </MenuButton>
        <MenuButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
          <span style={{ background: '#fef08a', padding: '0 2px' }}>H</span>
        </MenuButton>

        <span className="rte-separator" />

        <select
          className="rte-select"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size.replace('px', '')}</option>
          ))}
        </select>

        <span className="rte-separator" />

        <MenuButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          H2
        </MenuButton>
        <MenuButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          H3
        </MenuButton>
        <MenuButton active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Heading 4">
          H4
        </MenuButton>
        <MenuButton active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">
          P
        </MenuButton>

        <span className="rte-separator" />

        <MenuButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          &bull; List
        </MenuButton>
        <MenuButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          1. List
        </MenuButton>
        <MenuButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          &ldquo; Quote
        </MenuButton>

        <span className="rte-separator" />

        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          &mdash;
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting">
          Clear
        </MenuButton>
      </div>
      <EditorContent editor={editor} className="rte-content" />
    </div>
  )
}
