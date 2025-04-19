import { useChatStore } from "../store/useChatStore"
import { useEffect, useRef, useState } from "react"
import {
  Check,
  CheckCheck,
  SmilePlus,
  Loader2,
  ChevronDown,
} from "lucide-react"
import EmojiPicker, {
  EmojiStyle,
  Theme,
  EmojiClickData,
} from "emoji-picker-react"

import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput"
import MessageSkeleton from "./skeletons/MessageSkeleton"
import { useAuthStore } from "../store/useAuthStore"
import { formatMessageTime } from "../lib/utils"

interface Reaction {
  _id: string
  emoji: string
  userId: {
    _id: string
    fullName: string
    profilePic: string
  }
}

const formatDateSeparator = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }
}

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    toggleReaction,
    isLoadingMore,
    hasMoreMessages,
  } = useChatStore()
  const { authUser } = useAuthStore()
  const messageEndRef = useRef<HTMLDivElement>(null)
  const topMessageSentinelRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(
    null
  )
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false)

  useEffect(() => {
    if (selectedUser?._id) {
      const userId = selectedUser._id
      getMessages(userId)
      subscribeToMessages()
    }
    setShowScrollToBottomButton(false)

    return () => {
      unsubscribeFromMessages()
    }
  }, [getMessages, selectedUser, subscribeToMessages, unsubscribeFromMessages])

  useEffect(() => {
    if (selectedUser) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "auto",
        })
      }, 100)
    }
  }, [selectedUser])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (
          firstEntry.isIntersecting &&
          hasMoreMessages &&
          !isLoadingMore &&
          messages.length > 0
        ) {
          const oldestMessageTimestamp = messages[0]?.createdAt
          if (oldestMessageTimestamp) {
            console.log("Loading more messages before:", oldestMessageTimestamp)
            getMessages(
              selectedUser!._id,
              new Date(oldestMessageTimestamp).toISOString()
            )
          }
        }
      },
      { threshold: 1.0 }
    )

    const currentSentinel = topMessageSentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasMoreMessages, isLoadingMore, messages, getMessages, selectedUser])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setShowScrollToBottomButton(!entry.isIntersecting)
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "0px",
        threshold: 1.0,
      }
    )

    const currentEndRef = messageEndRef.current
    if (currentEndRef) {
      observer.observe(currentEndRef)
    }

    return () => {
      if (currentEndRef) {
        observer.unobserve(currentEndRef)
      }
    }
  }, [messages])

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const groupReactions = (reactions: Reaction[] = []) => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
  }

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji).catch((err) => {
      console.error("Failed to toggle reaction:", err)
    })
  }

  const handleEmojiSelect = (messageId: string, emojiData: EmojiClickData) => {
    handleToggleReaction(messageId, emojiData.emoji)
    setActiveEmojiPicker(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const pickerWrapper = document.getElementById(
        `emoji-picker-wrapper-${activeEmojiPicker}`
      )
      if (pickerWrapper && !pickerWrapper.contains(event.target as Node)) {
        const toggleButton = document.getElementById(
          `emoji-toggle-${activeEmojiPicker}`
        )
        if (!toggleButton?.contains(event.target as Node)) {
          setActiveEmojiPicker(null)
        }
      }
    }

    if (activeEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeEmojiPicker])

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ChatHeader />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse"
      >
        <div ref={messageEndRef} className="h-1" />

        {[...messages].reverse().map((message, index, arr) => {
          const messageDate = new Date(message.createdAt)
          const messageDateString = messageDate.toDateString()
          let showDateSeparator = false

          const nextMessage = arr[index + 1]
          if (
            !nextMessage ||
            new Date(nextMessage.createdAt).toDateString() !== messageDateString
          ) {
            showDateSeparator = true
          }

          const isMyMessage = message.senderId === authUser?._id
          const groupedReactions = groupReactions(message.reactions)
          const currentUserReactions = (message.reactions || [])
            .filter((r) => r.userId._id === authUser?._id)
            .map((r) => r.emoji)

          return (
            <div key={message._id} className="relative">
              {showDateSeparator && (
                <div className="text-center text-xs text-zinc-500 my-3">
                  {formatDateSeparator(messageDate)}
                </div>
              )}

              <div
                className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
              >
                <div className=" chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        (isMyMessage
                          ? authUser?.profilePic
                          : selectedUser?.profilePic) ?? "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div
                  className={`chat-header mb-1 flex items-center gap-1 ${
                    isMyMessage ? "justify-end" : ""
                  }`}
                >
                  <time className="text-xs opacity-50">
                    {formatMessageTime(messageDate)}
                  </time>
                  {isMyMessage && (
                    <span className="flex items-center">
                      {message.status === "sent" && (
                        <Check size={16} className="text-gray-500" />
                      )}
                      {message.status === "delivered" && (
                        <CheckCheck size={16} className="text-gray-500" />
                      )}
                      {message.status === "read" && (
                        <CheckCheck size={16} className="text-blue-500" />
                      )}
                    </span>
                  )}
                </div>
                <div className="chat-bubble flex flex-col relative group">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                  <button
                    id={`emoji-toggle-${message._id}`}
                    className={`absolute -top-3 p-1 rounded-full bg-base-300 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-zinc-100 ${
                      isMyMessage ? "-left-4" : "-right-4"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveEmojiPicker(
                        activeEmojiPicker === message._id ? null : message._id
                      )
                    }}
                    title="Add reaction"
                  >
                    <SmilePlus size={16} />
                  </button>
                </div>
                {Object.entries(groupedReactions).length > 0 && (
                  <div
                    className={`chat-footer flex gap-1 mt-1 ${
                      isMyMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    {Object.entries(groupedReactions).map(([emoji, count]) => {
                      const didCurrentUserReact =
                        currentUserReactions.includes(emoji)
                      return (
                        <button
                          key={emoji}
                          className={`badge badge-sm ${
                            didCurrentUserReact
                              ? "badge-primary"
                              : "badge-ghost"
                          } cursor-pointer hover:opacity-80`}
                          onClick={() =>
                            handleToggleReaction(message._id, emoji)
                          }
                          title={`Reacted by ${count} user${
                            count > 1 ? "s" : ""
                          }${didCurrentUserReact ? " (click to remove)" : ""}`}
                        >
                          {emoji} {count}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {activeEmojiPicker === message._id && (
                <div
                  id={`emoji-picker-wrapper-${message._id}`}
                  className={`absolute z-10 ${
                    isMyMessage ? "right-0" : "left-0"
                  } bottom-full mb-1`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      handleEmojiSelect(message._id, emojiData)
                    }
                    theme={Theme.DARK}
                    emojiStyle={EmojiStyle.NATIVE}
                    height={350}
                    width={300}
                    searchDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>
          )
        })}

        <div
          ref={topMessageSentinelRef}
          className="h-10 flex justify-center items-center"
        >
          {isLoadingMore && <Loader2 className="animate-spin" size={20} />}
        </div>
      </div>

      {showScrollToBottomButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[7rem] right-4 z-10 p-2 rounded-full bg-primary text-primary-content shadow-md hover:bg-primary/80 transition-all duration-300"
          title="Scroll to latest messages"
        >
          <ChevronDown size={18} />
        </button>
      )}

      <MessageInput />
    </div>
  )
}
export default ChatContainer
