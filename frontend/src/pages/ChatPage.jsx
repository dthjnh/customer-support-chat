import ChatBox from "../components/chat/ChatBox";

const ChatPage = () => {
  const token = localStorage.getItem("token");

  const roomId = "PASTE_ROOM_ID_HERE";
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (!token) return <div>Please login</div>;

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-2xl h-[80vh] bg-white">
        <ChatBox
          token={token}
          roomId={roomId}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default ChatPage;
