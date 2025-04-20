import { useEffect, useRef, useState } from "react"
import { useChatStore } from "../store/useChatStore"
import { Image, SendHorizontal, X, Smile } from "lucide-react"
import toast from "react-hot-toast"
import EmojiPicker, {
  Theme,
  EmojiStyle,
  EmojiClickData,
} from "emoji-picker-react"

const MessageInput = () => {
  const [text, setText] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const { sendMessage } = useChatStore()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textInputRef.current
    if (!textarea) return

    const start = textarea.selectionStart ?? text.length
    const end = textarea.selectionEnd ?? text.length
    const newText =
      text.substring(0, start) + emojiData.emoji + text.substring(end)
    setText(newText)

    const newCursorPosition = start + emojiData.emoji.length
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      adjustTextareaHeight()
    }, 0)
  }

  const adjustTextareaHeight = () => {
    const textarea = textInputRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [text])

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const trimmedText = text.trim()
    if (!trimmedText && !imagePreview) return

    try {
      await sendMessage({
        text: trimmedText || undefined,
        image: imagePreview ?? undefined,
      })

      setText("")
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setShowEmojiPicker(false)
      setTimeout(adjustTextareaHeight, 0)
    } catch (error) {
      console.error("Error occurred during sendMessage call:", error)
      toast.error("Failed to send message. Please try again.")
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  return (
    <div className="p-4 w-full relative">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 mb-2 z-20"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.NATIVE}
            height={350}
            width={300}
            searchDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-1 bg-base-200 rounded-lg p-2 border border-base-300">
          <button
            type="button"
            className={`btn btn-sm btn-circle btn-ghost self-end mb-1 ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={18} />
          </button>
          <button
            ref={emojiButtonRef}
            type="button"
            className="btn btn-sm btn-circle btn-ghost self-end mb-1"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={18} className="text-zinc-400" />
          </button>

          <textarea
            ref={textInputRef}
            rows={1}
            className="flex-1 textarea bg-transparent p-1.5 text-sm resize-none overflow-y-auto focus:outline-none placeholder:text-zinc-500 align-bottom"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ maxHeight: "calc(1.5rem * 5)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost self-end mb-1 text-primary disabled:text-base-content/30"
            disabled={!text.trim() && !imagePreview}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
export default MessageInput
