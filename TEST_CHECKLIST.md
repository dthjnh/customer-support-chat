# Media Features - Test Checklist & Quick Start

## Quick Start Guide

### 1. Restart Your Application
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Test Image Upload
1. Login to the chat application
2. Click the 🖼️ button in the message input
3. Select an image from your computer
4. The image should appear instantly in the message bubble
5. Refresh the page - image should still be there

### 3. Test Audio Recording
1. Click the 🎙️ button in the message input
2. When prompted, allow microphone access
3. Speak your message (you'll see "Recording... 5s" in the input)
4. Click the ⏹️ button to stop recording
5. Audio player appears in message with play button
6. Refresh page - audio should still be playable

## Complete Test Checklist

### Image Upload Tests ✓ / ✗

- [ ] Can click image button and open file picker
- [ ] Can select JPG image
- [ ] Can select PNG image
- [ ] Can select GIF image
- [ ] Image displays as thumbnail in bubble
- [ ] Image is responsive on different screen sizes
- [ ] Can send multiple images in sequence
- [ ] Can mix text and image messages
- [ ] Can hover and delete image message
- [ ] Deleted image is gone from recipient's chat
- [ ] Image persists after page refresh
- [ ] Image loads in new chat window

### Audio Recording Tests ✓ / ✗

- [ ] Can click mic button and grant permission
- [ ] Recording timer starts when button pressed
- [ ] Placeholder shows "Recording... Xs" format
- [ ] Can record for 30 seconds
- [ ] Stop button (⏹️) appears while recording
- [ ] Can press stop button to finish recording
- [ ] Audio player appears with controls
- [ ] Duration displays below player (e.g., "1m 15s")
- [ ] Can play audio multiple times
- [ ] Can seek through recording
- [ ] Audio persists after page refresh
- [ ] Can hover and delete audio message
- [ ] Multiple audio messages can be sent
- [ ] Audio works after recipient joins chat

### Mixed Message Tests ✓ / ✗

- [ ] Can send text then image then audio (sequence)
- [ ] All three message types appear correctly
- [ ] Message order is preserved
- [ ] Different message types don't interfere
- [ ] Can delete messages in any order
- [ ] Scroll works with mixed content
- [ ] Auto-scroll works with media messages

### Permission & Access Tests ✓ / ✗

- [ ] First mic access shows browser permission dialog
- [ ] Denying permission shows alert to user
- [ ] Allowing permission enables recording
- [ ] Image button works without special permission
- [ ] Both users can send media

### Browser Compatibility ✓ / ✗

- [ ] Chrome: Image upload works
- [ ] Chrome: Audio recording works
- [ ] Firefox: Image upload works
- [ ] Firefox: Audio recording works
- [ ] Safari: Image upload works
- [ ] Safari: Audio recording works
- [ ] Edge: Image upload works
- [ ] Edge: Audio recording works

### Real-time Communication Tests ✓ / ✗

- [ ] Image sent via Socket.IO appears instantly
- [ ] Audio sent via Socket.IO appears instantly
- [ ] Recipient sees image without refresh
- [ ] Recipient sees audio without refresh
- [ ] Image displays correctly on recipient side
- [ ] Audio plays correctly on recipient side
- [ ] Unread badge works with media messages
- [ ] Mark as read works with media messages

### Database Persistence Tests ✓ / ✗

- [ ] Image message saved to database
- [ ] Audio message saved to database
- [ ] Message type saved correctly (text/image/audio)
- [ ] Duration saved for audio messages
- [ ] Duration is null for images/text
- [ ] Existing text messages still work
- [ ] Old messages load correctly after refresh
- [ ] New messages load correctly after refresh
- [ ] Message history includes all types

### UI/UX Tests ✓ / ✗

- [ ] Buttons have clear hover states
- [ ] Buttons disabled during recording
- [ ] Recording button changes color (pink → red)
- [ ] Send button disabled if only whitespace
- [ ] Send button disabled during recording
- [ ] Image button disabled during recording
- [ ] Text input disabled during recording
- [ ] Recording shows time in placeholder
- [ ] Audio player has native controls
- [ ] Audio player responsive on mobile
- [ ] Message bubbles properly sized
- [ ] Layout doesn't break with media

### Performance Tests ✓ / ✗

- [ ] Small image (100KB) sends quickly
- [ ] Medium image (1MB) sends within 3 seconds
- [ ] Large image (5MB) sends within 10 seconds
- [ ] Short audio (10 seconds) sends quickly
- [ ] Long audio (1 minute) sends within 5 seconds
- [ ] No freezing during image base64 encoding
- [ ] No freezing during audio recording
- [ ] UI responsive while sending large files
- [ ] Multiple messages can be sent quickly

### Error Handling Tests ✓ / ✗

- [ ] Denying mic permission shows error
- [ ] Canceling file picker doesn't crash app
- [ ] Network error doesn't lose message
- [ ] Refreshing during upload keeps message
- [ ] Socket disconnect doesn't break UI
- [ ] Can reconnect and continue messaging

### Mobile Responsiveness Tests ✓ / ✗

- [ ] Buttons visible on mobile
- [ ] Image scales properly on small screens
- [ ] Audio player responsive on mobile
- [ ] Touch friendly button sizes
- [ ] No horizontal scroll needed
- [ ] Keyboard doesn't hide controls

### Edge Cases ✓ / ✗

- [ ] Very small image (1KB)
- [ ] Very large image (10MB) - should handle gracefully
- [ ] Image with special characters in name
- [ ] Very long audio recording (5+ minutes)
- [ ] Audio in noisy environment
- [ ] Multiple rapid clicks on buttons
- [ ] Record, delete, record again
- [ ] Send image to multiple users

## Expected Behavior

### When Recording Audio
```
Button changes: 🎙️ → ⏹️ (red)
Input placeholder: "Type a message..." → "Recording... 5s"
Input box: Disabled (grayed out)
Image button: Disabled
Send button: Disabled
```

### When Sending Image
```
1. File picker opens
2. Select image
3. Image immediately appears in chat
4. Own message bubble shows image
5. Other user sees image in their chat
6. Can delete with ✕ button on hover
```

### When Playing Audio
```
Browser native audio controls appear:
- Play/pause button
- Timeline scrubber
- Volume control
- Duration "1m 15s" below player
Can click any part of timeline to seek
```

## Known Limitations

1. **File Size**
   - Images limited by browser/network (typically 5-100MB limit)
   - No client-side size validation yet
   - Very large files may cause browser slowdown

2. **Audio Format**
   - Always recorded as WAV (uncompressed)
   - May use significant storage space
   - No compression implemented

3. **Storage**
   - All files stored as base64 in database
   - Increases database size by ~33% over original file size
   - No cloud storage integration

4. **Features**
   - No image editing/preview before sending
   - No audio editing/trimming
   - No file compression
   - No progress bar for large files

## Troubleshooting

### Image Not Displaying
- [ ] Check browser console for errors
- [ ] Verify file size is reasonable
- [ ] Try a different image format
- [ ] Clear browser cache
- [ ] Check database for type field value

### Audio Not Recording
- [ ] Check microphone permissions in browser settings
- [ ] Try a different browser
- [ ] Restart browser
- [ ] Check if microphone is plugged in/working
- [ ] Look for errors in browser console

### Messages Not Sending
- [ ] Check browser console for socket errors
- [ ] Verify internet connection
- [ ] Check if backend server is running
- [ ] Look for database connection errors in backend logs
- [ ] Verify both users are in same room

### Large Files Slow Down
- [ ] Reduce image resolution before upload
- [ ] Use compression tools (TinyPNG, JPEG-optimizer)
- [ ] For audio, use shorter recordings
- [ ] Clear browser cache to free memory

## Next Steps After Testing

If all tests pass:
1. ✅ Features are production-ready
2. Consider adding file size validation
3. Consider implementing compression
4. Consider migrating to cloud storage
5. Add more sophisticated error handling
6. Implement upload progress tracking

If some tests fail:
1. Document which test failed
2. Check browser console for error messages
3. Check backend logs for socket/database errors
4. Review the Technical Architecture guide
5. Debug using browser DevTools

## Debug Commands

### Check Socket Connection
```javascript
// In browser console
socket.connected  // should be true
socket.id         // should show socket ID
```

### Check Message Type
```javascript
// In browser console
// On any message in the chat
console.log(messages[0].type)  // should show "text", "image", or "audio"
console.log(messages[0].content.substring(0, 50))  // first 50 chars
```

### Check Database
```bash
# Connect to PostgreSQL
psql -U <user> -d customer_support_chat

# Check DirectMessage table
SELECT id, type, duration, content::text LIKE 'data:image/%' as is_image 
FROM "DirectMessage" LIMIT 10;

# Check Message table
SELECT id, type, duration, content::text LIKE 'data:audio/%' as is_audio 
FROM "Message" LIMIT 10;
```

## Quick Performance Checks

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Send an image
4. Look for Socket.IO message containing base64 data
5. Check size and duration

### React DevTools
1. Install React DevTools extension
2. Open Components tab
3. Check MessageInput state during recording
4. Verify `isRecording` state changes

### Browser Profiler
1. Open DevTools Performance tab
2. Record while sending image
3. Look for long tasks or frame drops
4. FileReader conversion might show in profile

---

**Last Updated:** 2025-01-21
**Status:** Ready for Testing
