import { io } from "socket.io-client";

export const socket = io("http://192.168.101.18:5000", {
  withCredentials: true,
  autoConnect: false,
});

export const connectSocket = (token) => {
  socket.auth = { token };
  socket.connect();
};

export default socket;