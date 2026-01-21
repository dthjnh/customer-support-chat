# UI Components Update Guide

## MessageInput Component

### New Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Message Input Bar                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────┐ 🖼️ 🎙️/⏹️ [SEND]  │
│  │ Type a message...               │                     │
│  │ (or: Recording... 5s)            │                     │
│  └─────────────────────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Buttons (Left to Right):
- 🖼️ Image picker (blue/indigo)
- 🎙️ Record button (pink/rose) → ⏹️ Stop button (red)
- [SEND] Gradient button (purple to violet)
```

### Button Styles

#### Image Button (🖼️)
- Default: Light indigo background (#e0e7ff)
- Hover: Darker indigo (#c7d2fe)
- Disabled (recording): Gray (#cbd5e1)
- Icon: 🖼️

#### Audio Record Button (🎙️/⏹️)
- Idle: Light pink background (#fce7f3)
- Recording: Bright red background (#fee2e2)
- Border during recording: 2px red (#fecaca)
- Icon: 🎙️ (record) → ⏹️ (stop)

#### Send Button
- Default: Gradient (purple #667eea → violet #764ba2)
- Hover: Slight elevation effect (translateY -2px)
- Disabled: Gray (#cbd5e1)
- Font: Bold 600 weight

## MessageBubble Component

### Text Message Display
```
┌──────────────────────────────────────────────────┐
│                                                  │
│              Received Message              ✕    │
│  This is a normal text message            (on   │
│  from a friend!                            hover)│
│                                                  │
└──────────────────────────────────────────────────┘
       ^
    Gray background for received messages
    (Gradient for sent messages)
```

### Image Message Display
```
┌──────────────────────────────────────────────────┐
│                                                  │
│    ┌──────────────────────┐           (shows   │
│    │                      │           on hover │
│    │   📷 Image Preview   │ ✕                  │
│    │   (max 300x400px)    │                    │
│    └──────────────────────┘                    │
│                                                  │
└──────────────────────────────────────────────────┘
     Padding reduced to 8px around image
     Max-width: 70% (wider than text messages)
```

### Audio Message Display
```
┌──────────────────────────────────────────────────┐
│                                                  │
│    ┌─────────────────────────────────┐          │
│    │  ▶️ |━━━━━━|  00:45  🔊        │ ✕       │
│    │  Audio Player Controls           │         │
│    └─────────────────────────────────┘         │
│    2m 15s  (duration label)                     │
│                                                  │
└──────────────────────────────────────────────────┘
     Audio player: width 200px, height 28px
     Duration displayed below in smaller font
```

## ChatBox Container

### Layout Structure
```
┌──────────────────────────────────────────────────┐
│  Friend's Name                    [×] Close      │  ← Header (fixed)
├──────────────────────────────────────────────────┤
│                                                  │
│  [12:45] Friend says: Hello!                    │
│                                                  │
│  [12:46] ┌────────────────────┐                │
│          │  📷 Shared Image   │                │
│          └────────────────────┘                │
│                                                  │
│  [12:47] You: ▶️ |━━━|  1m 30s                 │
│                                                  │
│  [12:48] You: Thanks for the image!           │  ← Scrollable area
│                                                  │
│  [12:49] Friend: You're welcome!              │
│                                                  │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐ 🖼️ 🎙️ SEND│  ← Fixed footer
│  │ Type a message...            │              │
│  └──────────────────────────────┘              │
└──────────────────────────────────────────────────┘

Responsive:
- Messages container: flex: 1 (takes remaining space)
- Auto-scroll only if user at bottom
- Can scroll up to see history without jumping back
```

## State Indicators

### Recording State
```
While Recording:
- Input text: "Recording... 5s" (updates every second)
- Input box: Disabled (grayed out)
- Image button: Disabled
- Audio button: Red with active state
- Send button: Disabled

Normal State:
- Input text: "Type a message..."
- Input box: Enabled, ready for typing
- Image button: Enabled
- Audio button: Enabled
- Send button: Enabled if text present
```

## Color Scheme

### Message Colors
- Sent messages: Gradient #667eea → #764ba2 with white text
- Received messages: Light gray #f3f4f6 with dark text #1f2937
- Delete button: Gray #9ca3af, turns red #ef4444 on hover

### Input Colors
- Input background: Light #f9fafb
- Input border: Light gray #e5e7eb
- Input focus border: Purple #667eea
- Input focus background: White #ffffff

### Button Colors
- Image button: Indigo #e0e7ff (text #3730a3)
- Audio button: Pink #fce7f3 (text #be123c)
- Audio recording: Red #fee2e2 (text #991b1b)
- Send button: Gradient purple to violet

## File Size Recommendations

For optimal performance:
- **Images**: 
  - Max file size: 5 MB (before base64 encoding)
  - Recommended: 1-2 MB
  - Format: JPG for photos, PNG for graphics

- **Audio**:
  - Recommended length: 30-60 seconds
  - Codec: WAV (uncompressed)
  - Typical: ~1 MB per minute of audio

- **Database**:
  - Average text message: ~200 bytes
  - Average image: 1-2 MB (base64 encoded)
  - Average audio: 1 MB per minute

## Accessibility Features

- Buttons have clear hover states
- Recording button provides visual + textual feedback
- Duration timer helps understand recording length
- Audio player has native browser controls
- Delete buttons show only on hover to reduce clutter
- All interactive elements have 1.5x minimum tap target (44px)

## Mobile Responsiveness

The components automatically scale on smaller screens:
- Input area maintains padding and button spacing
- Message bubbles wrap text appropriately
- Image/audio containers scale to fit screen width
- Recording timer remains visible and readable

## Future UI Enhancements

Potential improvements:
1. Image preview before sending
2. Drag-and-drop upload area
3. Loading progress for large files
4. Retry failed uploads
5. Audio waveform visualization during recording
6. File size warnings before upload
7. Thumbnail grid view for media-heavy conversations
