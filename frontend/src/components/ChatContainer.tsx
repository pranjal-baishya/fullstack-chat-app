import { useChatStore } from "../store/useChatStore"
import { useEffect, useRef, useState } from "react"
import { Check, CheckCheck, SmilePlus } from "lucide-react"
import EmojiPicker, { EmojiStyle, Theme, EmojiClickData } from "emoji-picker-react"

import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput"
import MessageSkeleton from "./skeletons/MessageSkeleton"
import { useAuthStore } from "../store/useAuthStore"
import { formatMessageTime } from "../lib/utils"

interface Reaction {
    _id: string;
    emoji: string;
    userId: {
      _id: string;
      fullName: string;
      profilePic: string;
    };
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
  } = useChatStore()
  const { authUser } = useAuthStore()
  const messageEndRef = useRef<HTMLDivElement>(null)
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null)

  useEffect(() => {

    if (selectedUser?._id) {
      const userId = selectedUser._id;
      getMessages(userId)
      subscribeToMessages()
    }

    return () => {
      unsubscribeFromMessages()
    }
  }, [getMessages, selectedUser?._id, subscribeToMessages, unsubscribeFromMessages])

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const groupReactions = (reactions: Reaction[] = []) => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji).catch(err => {
        console.error("Failed to toggle reaction:", err);
        // Error toast is handled within the store function
    });
  };

  const handleEmojiSelect = (
    messageId: string,
    emojiData: EmojiClickData
  ) => {
    handleToggleReaction(messageId, emojiData.emoji);
    setActiveEmojiPicker(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const pickerWrapper = document.getElementById(`emoji-picker-wrapper-${activeEmojiPicker}`);
      if (pickerWrapper && !pickerWrapper.contains(event.target as Node)) {
        const toggleButton = document.getElementById(`emoji-toggle-${activeEmojiPicker}`);
        if (!toggleButton || !toggleButton.contains(event.target as Node)) {
          setActiveEmojiPicker(null);
        }
      }
    };

    if (activeEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeEmojiPicker]);

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
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => {
          const isMyMessage = message.senderId === authUser?._id;
          const groupedReactions = groupReactions(message.reactions);
          const currentUserReactions = (message.reactions || []).filter(r => r.userId._id === authUser?._id).map(r => r.emoji);

          return (
            <div key={message._id} ref={messages[messages.length - 1]._id === message._id ? messageEndRef : null} className="relative">
              <div className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}>
                <div className=" chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        isMyMessage
                          ? authUser?.profilePic ?? "/avatar.png"
                          : selectedUser?.profilePic ?? "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className={`chat-header mb-1 flex items-center gap-1 ${isMyMessage ? "justify-end" : ""}`}>
                  <time className="text-xs opacity-50">
                    {formatMessageTime(new Date(message.createdAt))}
                  </time>
                  {isMyMessage && (
                    <span className="flex items-center">
                      {message.status === 'sent' && <Check size={16} className="text-gray-500" />}
                      {message.status === 'delivered' && <CheckCheck size={16} className="text-gray-500" />}
                      {message.status === 'read' && <CheckCheck size={16} className="text-blue-500" />}
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
                    className={`absolute -top-3 p-1 rounded-full bg-base-300 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-zinc-100 ${isMyMessage ? '-left-4' : '-right-4'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveEmojiPicker(activeEmojiPicker === message._id ? null : message._id);
                    }}
                    title="Add reaction"
                  >
                    <SmilePlus size={16} />
                  </button>
                </div>
                {Object.entries(groupedReactions).length > 0 && (
                  <div className={`chat-footer flex gap-1 mt-1 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                    {Object.entries(groupedReactions).map(([emoji, count]) => {
                      const didCurrentUserReact = currentUserReactions.includes(emoji);
                      return (
                        <button
                          key={emoji}
                          className={`badge badge-sm ${didCurrentUserReact ? 'badge-primary' : 'badge-ghost'} cursor-pointer hover:opacity-80`}
                          onClick={() => handleToggleReaction(message._id, emoji)}
                          title={`Reacted by ${count} user${count > 1 ? 's' : ''}${didCurrentUserReact ? ' (click to remove)' : ''}`}
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {activeEmojiPicker === message._id && (
                <div
                    id={`emoji-picker-wrapper-${message._id}`}
                    className={`absolute z-10 ${isMyMessage ? 'right-0' : 'left-0'} bottom-full mb-1`}
                    onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => handleEmojiSelect(message._id, emojiData)}
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
      </div>

      <MessageInput />
    </div>
  )
}
export default ChatContainer
