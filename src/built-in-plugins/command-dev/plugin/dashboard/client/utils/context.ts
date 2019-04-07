import React = require('react');

export const SocketContext = React.createContext<SocketIOClient.Socket>(null);
