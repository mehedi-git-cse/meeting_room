# Socket.IO Events

## Chat and Presence

- `message:new`: create and broadcast channel message
- `message:edit`: update existing channel message
- `message:delete`: delete channel message
- `user:typing`: typing indicator in channel
- `user:online`: fired when user connects
- `user:offline`: fired when user fully disconnects

## DM

- `dm:join`: join a DM room
- `dm:message`: emit a DM message event to room participants

## WebRTC Signaling

- `webrtc:offer`: SDP offer relay
- `webrtc:answer`: SDP answer relay
- `webrtc:ice-candidate`: ICE candidate relay
- `webrtc:screen-share-start`: presence signal for screen share start
- `webrtc:screen-share-stop`: presence signal for screen share stop

## Suggested ICE Setup

Use at least:

- One public STUN server
- One or more TURN relays with credential rotation

Example shape:

```json
{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    {
      "urls": ["turn:turn.example.com:3478"],
      "username": "turn-user",
      "credential": "turn-password"
    }
  ]
}
```
