import { useChatStore } from "../store/useChatStore"
import Sidebar from "../components/Sidebar"
import NoChatSelected from "../components/NoChatSelected"
import ChatContainer from "../components/ChatContainer"

const HomePage = () => {
  const { selectedUser } = useChatStore()

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      
      <div className="flex flex-col flex-1 bg-base-200">
         {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  )
}
export default HomePage
