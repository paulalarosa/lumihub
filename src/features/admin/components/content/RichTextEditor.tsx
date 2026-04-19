import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImagePlus,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadContentImage } from './uploadContentImage'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto my-4',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[320px] px-4 py-3 text-sm leading-relaxed text-white/85 [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white [&_a]:text-white [&_a]:underline [&_img]:rounded-none [&_img]:border [&_img]:border-white/10',
        'aria-label': placeholder ?? 'Editor de conteúdo',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return

    setUploading(true)
    try {
      const url = await uploadContentImage(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      toast.success('Imagem enviada')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (!editor) return null

  const tool = (active: boolean, onClick: () => void, Icon: typeof Bold, label: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-8 h-8 flex items-center justify-center border transition-colors ${
        active
          ? 'border-white/40 bg-white/10 text-white'
          : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-1 p-2 border-b border-white/10 flex-wrap">
        {tool(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), Bold, 'Negrito')}
        {tool(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), Italic, 'Itálico')}
        <span className="w-px h-5 bg-white/10 mx-1" />
        {tool(
          editor.isActive('heading', { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          Heading2,
          'Título 2',
        )}
        {tool(
          editor.isActive('heading', { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          Heading3,
          'Título 3',
        )}
        <span className="w-px h-5 bg-white/10 mx-1" />
        {tool(
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          List,
          'Lista',
        )}
        {tool(
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
          ListOrdered,
          'Lista numerada',
        )}
        {tool(
          editor.isActive('blockquote'),
          () => editor.chain().focus().toggleBlockquote().run(),
          Quote,
          'Citação',
        )}
        <span className="w-px h-5 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL do link:')
            if (url) {
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setMark('link', { href: url })
                .run()
            }
          }}
          aria-label="Inserir link"
          title="Inserir link"
          className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          aria-label="Inserir imagem"
          title="Inserir imagem"
          className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="flex-1" />
        {tool(false, () => editor.chain().focus().undo().run(), Undo, 'Desfazer')}
        {tool(false, () => editor.chain().focus().redo().run(), Redo, 'Refazer')}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
