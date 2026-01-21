# Media Features - Technical Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SENDING IMAGE                              │
├─────────────────────────────────────────────────────────────────────┤

User selects image
        ↓
[MessageInput] FileReader converts to base64
        ↓
onSend({ type: "image", content: "data:image/png;base64,..." })
        ↓
[ChatBox] Optimistic update + socket emit
        ↓
socket.emit("sendMessage", {
  roomId: "userId1|userId2",
  type: "image",
  content: "data:image/png;base64,...",
  isDirect: true
})
        ↓
[Backend Socket] Handler receives message
        ↓
prisma.directMessage.create({
  content: "data:image/png;base64,...",
  type: "image",
  senderId: "userId1",
  friendshipId: "..."
})
        ↓
Database: Stores base64 in VARCHAR field
        ↓
io.to(roomId).emit("receiveMessage", {...message})
        ↓
[Frontend Socket Listener] Updates messages state
        ↓
[MessageBubble] Detects type="image" and renders <img>

```

## Message Object Structure

### Text Message
```javascript
{
  id: "msg-uuid-123",
  type: "text",                    // ← NEW
  content: "Hello, how are you?",
  senderId: "user-uuid-456",
  createdAt: "2025-01-21T10:30:00Z",
  isRead: false,
  roomId: "userId1|userId2"        // for direct messages
}
```

### Image Message
```javascript
{
  id: "msg-uuid-123",
  type: "image",                   // ← NEW
  content: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  duration: null,                  // ← NEW (always null for images)
  senderId: "user-uuid-456",
  createdAt: "2025-01-21T10:30:00Z",
  isRead: false,
  roomId: "userId1|userId2"
}
```

### Audio Message
```javascript
{
  id: "msg-uuid-123",
  type: "audio",                   // ← NEW
  content: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAA...",
  duration: 45,                    // ← NEW (seconds)
  senderId: "user-uuid-456",
  createdAt: "2025-01-21T10:30:00Z",
  isRead: false,
  roomId: "userId1|userId2"
}
```

## Socket Events

### sendMessage Event

**Emitted from:** Frontend (ChatBox component)

```javascript
socket.emit("sendMessage", {
  roomId: string,                    // "userId1|userId2" or chatRoomId
  content: string,                   // base64 or plain text
  type: "text" | "image" | "audio",  // NEW: message type
  duration?: number,                 // NEW: only for audio (seconds)
  isDirect: boolean                  // true for direct messages
});
```

**Handled by:** Backend (src/sockets/chat.js)

**Database Save:**
- Text: `type: "text", duration: null`
- Image: `type: "image", duration: null`
- Audio: `type: "audio", duration: 45` (e.g.)

**Broadcast:** `io.to(roomId).emit("receiveMessage", {...})`

### receiveMessage Event

**Emitted from:** Backend socket

```javascript
io.to(roomId).emit("receiveMessage", {
  id: "msg-uuid",
  type: "text" | "image" | "audio",
  content: string,
  duration: number | null,
  senderId: "user-uuid",
  createdAt: string,
  isRead: boolean,
  sender: {
    id: "user-uuid",
    name: "John Doe",
    email: "john@example.com"
  },
  roomId: "userId1|userId2"
});
```

**Received by:** Frontend Socket listeners

## Database Schema Changes

### DirectMessage Table

#### Before
```sql
CREATE TABLE "DirectMessage" (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  isRead BOOLEAN DEFAULT false,
  senderId TEXT NOT NULL,
  friendshipId TEXT NOT NULL
);
```

#### After (NEW FIELDS)
```sql
CREATE TABLE "DirectMessage" (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',          -- ← NEW
  duration INTEGER,                  -- ← NEW (nullable)
  createdAt TIMESTAMP DEFAULT now(),
  isRead BOOLEAN DEFAULT false,
  senderId TEXT NOT NULL,
  friendshipId TEXT NOT NULL
);
```

### Message Table

#### Before
```sql
CREATE TABLE "Message" (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  senderId TEXT NOT NULL,
  roomId TEXT NOT NULL
);
```

#### After (NEW FIELDS)
```sql
CREATE TABLE "Message" (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',          -- ← NEW
  duration INTEGER,                  -- ← NEW (nullable)
  createdAt TIMESTAMP DEFAULT now(),
  senderId TEXT NOT NULL,
  roomId TEXT NOT NULL
);
```

## Frontend Component API

### MessageInput Component

**Props:**
```javascript
onSend: (messageData: {
  type: "text" | "image" | "audio",
  content: string,                    // base64 for images/audio
  duration?: number,                  // only for audio
  fileName?: string                   // optional for images
}) => void
```

**Features:**
- Image upload via file picker
- Audio recording via MediaRecorder API
- Duration tracking during recording
- Disabled state during recording
- Enter key to send (text only)

**Internal State:**
```javascript
const [text, setText] = useState("");
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const mediaRecorderRef = useRef(null);
const chunksRef = useRef([]);
const fileInputRef = useRef(null);
```

### ChatBox Component

**Updated handleSend:**
```javascript
const handleSend = (messageData) => {
  // Accept both string (legacy) and object (new format)
  const msgObject = typeof messageData === "string" 
    ? { type: "text", content: messageData }
    : messageData;
  
  // ... validation and optimistic update
  
  socket.emit("sendMessage", {
    roomId,
    ...msgObject,
    isDirect
  });
};
```

### MessageBubble Component

**Rendering Logic:**
```javascript
const renderContent = () => {
  if (message.type === "image") {
    return <img src={message.content} alt="Shared image" />;
  }
  
  if (message.type === "audio") {
    return (
      <div>
        <audio src={message.content} controls />
        <span>{formatDuration(message.duration)}</span>
      </div>
    );
  }
  
  return message.content;  // text
};
```

## Performance Considerations

### Client-Side
- FileReader API blocks main thread for large files
- Base64 encoding increases file size by ~33%
- Audio recordings are uncompressed WAV format
- No file size validation in current implementation

### Network
- Base64 content sent directly over WebSocket
- No chunking for large files
- Real-time encoding may cause network lag

### Database
- PostgreSQL VARCHAR can handle base64 encoded data
- No indexing needed for content field
- Query performance not impacted by base64 size

### Recommendations for Production

1. **File Size Limits:**
   - Enforce max 5MB for images
   - Enforce max 1 minute for audio
   - Validate on frontend before encoding

2. **Compression:**
   - Compress images before base64 encoding
   - Use MP3 or OGG for audio instead of WAV
   - Consider client-side compression libraries

3. **Cloud Storage:**
   - Upload to S3/Firebase instead of database
   - Store only URL references in database
   - Reduces database size and improves query performance

4. **Chunked Upload:**
   - For large files, implement chunked upload
   - Show progress bar
   - Enable resumable uploads

## Error Handling

### Current Implementation
- Microphone access denied: Alert to user
- File upload cancel: Silently ignored
- Socket disconnect: Message queued (optimistic update)

### Missing Error Handling
- No file size validation
- No network error recovery
- No timeout for large file transmission
- No retry mechanism

## Migration Path

### From Text-Only to Media
1. ✅ Prisma schema updated (type, duration fields)
2. ✅ Backend socket handler updated
3. ✅ Frontend components updated
4. ✅ Database migration applied
5. Database contains both old (text) and new (media) messages
6. Backward compatibility maintained (type defaults to "text")

### Future Upgrades
- Implement cloud storage integration
- Add file compression
- Add upload progress tracking
- Add rate limiting for media uploads
- Implement media preview caching

## Testing Scenarios

### Test Case 1: Send Text + Image in Sequence
```
1. User types "Check this out"
2. User clicks send (text message sent)
3. User clicks image button
4. User selects image.jpg (5MB)
5. Image appears in chat after base64 encoding
6. Recipient receives both messages
✓ Result: Both messages show correctly
```

### Test Case 2: Audio Recording
```
1. User clicks mic button
2. Microphone permission granted
3. User speaks for 15 seconds
4. User clicks stop button
5. Audio appears in chat with play button
6. Recipient can play the audio
✓ Result: Audio plays correctly with duration "15s"
```

### Test Case 3: Media Persistence
```
1. Open chat, send image
2. Refresh page
3. Messages reload from database
4. Image still displays correctly
✓ Result: Image persists and displays after reload
```

### Test Case 4: Delete Media
```
1. Send image message
2. Hover over message
3. Click delete button
4. Message removed from chat and database
✓ Result: Message deleted for both users
```
