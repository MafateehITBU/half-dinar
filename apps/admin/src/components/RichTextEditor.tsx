import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Icon } from '@iconify/react';

const COLOR_PRESETS = [
  '#0F172A',
  '#0B4745',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert legacy plain text (newlines) into HTML TipTap can edit. */
export function toEditorHtml(value: string): string {
  if (!value?.trim()) return '';
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  minHeight?: string;
  className?: string;
};

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
        active
          ? 'bg-[var(--brand-green)] text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  dir = 'rtl',
  minHeight = '140px',
  className = '',
}: RichTextEditorProps) {
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content outline-none',
        dir,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    const next = toEditorHtml(value);
    lastEmitted.current = value;
    editor.commands.setContent(next || '', { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: 'rich-text-editor-content outline-none',
          dir,
        },
      },
    });
  }, [dir, editor]);

  if (!editor) {
    return (
      <div
        className={`rich-text-editor animate-pulse rounded-xl border-2 bg-slate-50 ${className}`}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`rich-text-editor overflow-hidden rounded-xl border-2 bg-white ${className}`} dir={dir}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icon icon="mdi:format-bold" className="text-lg" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icon icon="mdi:format-italic" className="text-lg" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Icon icon="mdi:format-underline" className="text-lg" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon icon="mdi:format-list-bulleted" className="text-lg" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Icon icon="mdi:format-list-numbered" className="text-lg" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          title="Horizontal line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Icon icon="mdi:minus" className="text-lg" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <div className="relative flex items-center gap-1 px-1">
          <Icon icon="mdi:format-color-text" className="text-lg text-slate-600" />
          <input
            type="color"
            title="Font color"
            className="h-7 w-7 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
            value={editor.getAttributes('textStyle').color || '#0F172A'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
          <div className="hidden items-center gap-0.5 sm:flex">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="h-5 w-5 rounded-full border border-slate-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <ToolbarButton title="Reset color" onClick={() => editor.chain().focus().unsetColor().run()}>
            <Icon icon="mdi:format-color-marker-cancel" className="text-base" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} style={{ minHeight }} className="rich-text-editor-body px-3 py-2.5 text-sm" />
    </div>
  );
}
