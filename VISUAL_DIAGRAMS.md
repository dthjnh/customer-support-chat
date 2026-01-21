# Visual Diagrams - Media Features Architecture

## Application Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER SUPPORT CHAT                           │
│                    With Media Features (v1.0)                        │
└──────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════════╗
║                         FRONTEND (React + Vite)                        ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌───────────────────────────────────────────────────────────────┐   ║
║  │ App.jsx                                                       │   ║
║  │ ├─ Login.jsx        [Auth page]                             │   ║
║  │ ├─ Register.jsx     [Auth page]                             │   ║
║  │ ├─ ContactsPage.jsx [Friend management]                     │   ║
║  │ ├─ MessengerPage.jsx                                        │   ║
║  │ │  ├─ Conversations List                                    │   ║
║  │ │  └─ DirectMessage.jsx                                     │   ║
║  │ │     ├─ ChatBox.jsx           ⭐ UPDATED                  │   ║
║  │ │     │  ├─ MessageBubble.jsx  ⭐ UPDATED (type support)  │   ║
║  │ │     │  ├─ MessageList        (scroll + render)           │   ║
║  │ │     │  └─ MessageInput.jsx   ⭐ UPDATED (image + audio)│   ║
║  │ │     │     ├─ Text input                                   │   ║
║  │ │     │     ├─ 🖼️ Image button  ← NEW                    │   ║
║  │ │     │     ├─ 🎙️ Audio button  ← NEW                    │   ║
║  │ │     │     └─ Send button                                  │   ║
║  │ │     └─ Socket listeners (receive, delete, mark-read)     │   ║
║  │ └─ Other pages...                                           │   ║
║  └───────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ║
║  │ lib/api.js                   │  │ lib/socket.js                │  ║
║  │ (Axios HTTP client)          │  │ (Socket.IO client)           │  ║
║  │                              │  │                              │  ║
║  │ - GET /users/friends         │  │ - joinRoom                   │  ║
║  │ - GET /direct-messages/:id   │  │ - sendMessage ⭐ UPDATED  │  ║
║  │ - POST /friends/:id          │  │ - receiveMessage ⭐ UPDATED│  ║
║  │ - DELETE /direct-messages    │  │ - deleteMessage              │  ║
║  │ - PUT /mark-read             │  │ - messageDeleted             │  ║
║  └──────────────────────────────┘  └──────────────────────────────┘  ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

                              ⬇️ Socket.IO

╔════════════════════════════════════════════════════════════════════════╗
║                         BACKEND (Node.js/Express)                      ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ src/sockets/chat.js                ⭐ UPDATED                 │ ║
║  │                                                                 │ ║
║  │ Socket Events Handled:                                         │ ║
║  │ • joinRoom({roomId})                                           │ ║
║  │ • sendMessage({                                                │ ║
║  │     roomId,                                                    │ ║
║  │     content,      // text, base64 image, base64 audio         │ ║
║  │     type,         // "text" | "image" | "audio"  ← NEW       │ ║
║  │     duration,     // seconds for audio  ← NEW                │ ║
║  │     isDirect                                                   │ ║
║  │   })                                                            │ ║
║  │ • deleteMessage({messageId, roomId, isDirect})               │ ║
║  │ • disconnect()                                                 │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ║
║  │ src/prisma.js                │  │ src/routes/*.routes.js       │  ║
║  │ (Prisma client setup)        │  │                              │  ║
║  │                              │  │ - auth.routes.js             │  ║
║  │ Connects to database         │  │ - user.routes.js ⭐ USES DB│  ║
║  │ and provides ORM             │  │ - message.routes.js          │  ║
║  │                              │  │                              │  ║
║  └──────────────────────────────┘  └──────────────────────────────┘  ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

                              ⬇️ Prisma ORM

╔════════════════════════════════════════════════════════════════════════╗
║                    DATABASE (PostgreSQL)                               ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  DirectMessage Table:                                                  ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ id (UUID)                                                       │ ║
║  │ content (TEXT) - base64 encoded for images/audio               │ ║
║  │ type (VARCHAR) ⭐ NEW - "text"|"image"|"audio"                │ ║
║  │ duration (INTEGER) ⭐ NEW - seconds for audio, null otherwise  │ ║
║  │ createdAt (TIMESTAMP)                                          │ ║
║  │ isRead (BOOLEAN)                                               │ ║
║  │ senderId (UUID) - FK to User                                   │ ║
║  │ friendshipId (UUID) - FK to Friend                             │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  Message Table:                                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ id (UUID)                                                       │ ║
║  │ content (TEXT) - base64 encoded for images/audio               │ ║
║  │ type (VARCHAR) ⭐ NEW - "text"|"image"|"audio"                │ ║
║  │ duration (INTEGER) ⭐ NEW - seconds for audio, null otherwise  │ ║
║  │ createdAt (TIMESTAMP)                                          │ ║
║  │ senderId (UUID) - FK to User                                   │ ║
║  │ roomId (UUID) - FK to ChatRoom                                 │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  Other Tables: (unchanged)                                             ║
║  • User (authentication data)                                         ║
║  • Friend (friendship relationships)                                  ║
║  • ChatRoom (support channels)                                        ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

## Message Type Processing Flow

```
INPUT: User Action in MessageInput
│
├─ TYPE 1: Text Message
│  │
│  ├─ User types: "Hello!"
│  │  → onSend({ type: "text", content: "Hello!" })
│  │  → ChatBox emits: socket.emit("sendMessage", {roomId, type: "text", content, isDirect})
│  │  → Backend: Creates Message/DirectMessage with type="text"
│  │  → Database: Stores as plain text
│  │  → Frontend display: MessageBubble renders plain text
│  │
│
├─ TYPE 2: Image Message
│  │
│  ├─ User clicks 🖼️ button
│  │  → File picker opens
│  │  → User selects image.jpg
│  │  → FileReader.readAsDataURL() converts to base64
│  │  → onSend({ type: "image", content: "data:image/jpeg;base64,..." })
│  │  → ChatBox emits: socket.emit("sendMessage", {roomId, type: "image", content, isDirect})
│  │  → Backend: Creates Message/DirectMessage with type="image"
│  │  → Database: Stores base64 data in content field
│  │  → Frontend display: MessageBubble detects type="image" and renders <img>
│  │
│
└─ TYPE 3: Audio Message
   │
   ├─ User clicks 🎙️ button
   │  → Browser requests microphone permission
   │  → MediaRecorder starts recording
   │  → Recording time displays: "Recording... 5s"
   │  → User speaks...
   │  → User clicks ⏹️ button
   │  → MediaRecorder stops and creates blob
   │  → FileReader.readAsDataURL() converts to base64
   │  → onSend({ type: "audio", content: "data:audio/wav;base64,...", duration: 45 })
   │  → ChatBox emits: socket.emit("sendMessage", {roomId, type: "audio", content, duration, isDirect})
   │  → Backend: Creates Message/DirectMessage with type="audio", duration=45
   │  → Database: Stores base64 data + duration metadata
   │  → Frontend display: MessageBubble detects type="audio" and renders <audio> + duration
```

## Message Display Decision Tree

```
MessageBubble receives message object
        │
        ├─ Check: message.type
        │
        ├─ IF type === "text" (default)
        │  │
        │  └─ renderContent() returns:
        │     message.content
        │     (plain string)
        │
        ├─ IF type === "image"
        │  │
        │  └─ renderContent() returns:
        │     <img 
        │       src={message.content}  ← base64 data URL
        │       maxWidth="300px"
        │       maxHeight="400px"
        │     />
        │
        └─ IF type === "audio"
           │
           └─ renderContent() returns:
              <div>
                <audio 
                  src={message.content}  ← base64 data URL
                  controls
                />
                <span>
                  {message.duration}s duration
                </span>
              </div>
```

## Recording State Machine

```
┌─────────────┐
│   IDLE      │ isRecording = false
│             │ recordingTime = 0
│             │ Input enabled
└──────┬──────┘
       │ User clicks 🎙️
       │
       ▼
┌─────────────────────────┐
│   RECORDING             │ isRecording = true
│                         │ recordingTime increases every 1s
│  - Mic permission ok    │ All inputs disabled
│  - MediaRecorder active │ Button shows ⏹️ (red)
│  - Blob chunks stored   │ Placeholder: "Recording... Xs"
└──────┬──────────────────┘
       │ User clicks ⏹️
       │
       ▼
┌──────────────────────────────┐
│  PROCESSING                  │ isRecording = false
│  - MediaRecorder stops       │ recordingTime resets to 0
│  - Blob created from chunks  │ FileReader converts to base64
│  - Base64 encoding finished  │ onSend() called
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  SENDING                     │ Socket message emitted
│  - Message queued            │ Message sent to backend
│  - Optimistic update         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  DISPLAYING                  │ Message appears in chat
│  - MessageBubble renders     │ Audio player ready to play
│  - Audio player active       │ User can play multiple times
│  - Duration shown            │
└──────────────────────────────┘
```

## Data Size Comparison

```
Message Type: Text
├─ Original: "Hello" = 5 bytes
├─ Stored: "Hello" = 5 bytes
├─ Transmission: ~100 bytes (with metadata)
└─ Example: 💬 Hello!

Message Type: Image (JPG photo)
├─ Original file: 2.4 MB
├─ Base64 encoded: 3.2 MB (+33%)
├─ Stored in DB: 3.2 MB
├─ Transmission: 3.2 MB over WebSocket
└─ Example: 🖼️ [Picture displayed 300x200]

Message Type: Audio (30 seconds)
├─ Original recording: ~700 KB (WAV)
├─ Base64 encoded: ~933 KB (+33%)
├─ Stored in DB: ~933 KB
├─ Transmission: ~933 KB over WebSocket
└─ Example: 🎙️ ▶️ Play [30s audio]
```

## Browser API Usage

```
Image Upload:
┌─────────────────────────────────────────┐
│ FileReader API                          │
│ ├─ readAsDataURL()                      │
│ └─ Result: data:image/jpeg;base64,....  │
└─────────────────────────────────────────┘

Audio Recording:
┌──────────────────────────────────────────────────────┐
│ MediaRecorder API                                    │
│ ├─ getUserMedia()    ← Request microphone permission│
│ ├─ MediaRecorder()   ← Start recording              │
│ ├─ ondataavailable   ← Collect audio chunks         │
│ └─ Blob()            ← Combine chunks into file      │
│                                                       │
│ FileReader API (then)                               │
│ └─ readAsDataURL()   ← Convert blob to base64       │
└──────────────────────────────────────────────────────┘
```

## Socket Message Payload Comparison

```
Text Message Payload (Socket):
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   type: "sendMessage",                               │
│   data: {                                            │
│     roomId: "user1|user2",                           │
│     content: "Hello!",                               │
│     isDirect: true                                   │
│   },                                                 │
│   size: ~150 bytes                                   │
│ }                                                    │
└──────────────────────────────────────────────────────┘

Image Message Payload (Socket):
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   type: "sendMessage",                               │
│   data: {                                            │
│     roomId: "user1|user2",                           │
│     content: "data:image/jpeg;base64,/9j/4AAQSkZ...", │
│     type: "image",          ← NEW FIELD             │
│     isDirect: true                                   │
│   },                                                 │
│   size: ~3.2 MB                                      │
│ }                                                    │
└──────────────────────────────────────────────────────┘

Audio Message Payload (Socket):
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   type: "sendMessage",                               │
│   data: {                                            │
│     roomId: "user1|user2",                           │
│     content: "data:audio/wav;base64,UklGRiYAAAA...", │
│     type: "audio",          ← NEW FIELD             │
│     duration: 45,           ← NEW FIELD             │
│     isDirect: true                                   │
│   },                                                 │
│   size: ~933 KB                                      │
│ }                                                    │
└──────────────────────────────────────────────────────┘
```

## Real-Time Flow Example

```
SCENARIO: Alice sends image to Bob

Timeline:
────────

[T+0s] Alice clicks 🖼️ button
       └─ File picker opens

[T+2s] Alice selects photo.jpg
       └─ FileReader starts encoding

[T+3s] Base64 encoding complete
       ├─ onSend() called
       ├─ Optimistic update: image appears in chat immediately
       └─ socket.emit("sendMessage", {...image data})

[T+4s] Backend receives socket message
       ├─ Creates DirectMessage record with type="image"
       ├─ Stores base64 in database
       └─ io.to(roomId).emit("receiveMessage", {...})

[T+5s] Bob's browser receives "receiveMessage" event
       ├─ Message added to state
       ├─ MessageBubble detects type="image"
       ├─ Image <img> tag rendered
       └─ Bob sees image in chat

Result: Image appears in both chats in ~5 seconds
```

---

**Visual Diagrams Version:** 1.0
**Last Updated:** 2025-01-21
