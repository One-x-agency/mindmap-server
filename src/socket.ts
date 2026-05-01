import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '@/shared/configs/logger.js';
import Handler from '@/socket.events.js';

let socketIo: Server | null = null;


function initSocketHandler(io: Server) {

    io.on('connection', (socket) => Handler({ io, socket }));

    io.on('connect_error', (error) => {
        Logger.error(`Socket connection error: ${error}`);
    });

    io.on('error', (error) => {
        Logger.error(`Socket error: ${error}`);
    });

}

export async function initSocket (server: HttpServer) {
    const io = new Server(server, {
        transports: ['websocket'],
    });

    socketIo = io;

    initSocketHandler(io);

    return io;
}

const SocketService = {
    get io() { return socketIo; },

    init: initSocket,

    async isUserOnline(userId: string): Promise<boolean> {
        if (!socketIo) return false;

        const sockets = await socketIo.in(userId).fetchSockets();
        return sockets.length > 0;
    },
};

export default SocketService;
