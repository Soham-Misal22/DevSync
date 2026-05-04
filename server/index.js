const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");
const projectRoutes = require("./routes/projectroutes");
const taskRoutes = require("./routes/taskroutes");
const snippetRoutes = require("./routes/snippetroutes");
const vaultRoutes = require("./routes/vaultroutes");
const snapshotRoutes = require("./routes/snapshotRoutes");
const { errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();
connectDB();

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "*"
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT"]
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinProject', (projectId) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
    });

    socket.on('leaveProject', (projectId) => {
        socket.leave(projectId);
        console.log(`Socket ${socket.id} left project ${projectId}`);
    });

    socket.on('joinLiveCode', (projectId) => {
        const room = `livecode_${projectId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined livecode ${projectId}`);
    });

    socket.on('leaveLiveCode', (projectId) => {
        const room = `livecode_${projectId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left livecode ${projectId}`);
    });

    socket.on('codeChange', ({ projectId, code }) => {
        socket.to(`livecode_${projectId}`).emit('receiveCodeChange', code);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/snippet", snippetRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/snapshot", snapshotRoutes);
app.use("/api/ai", require("./routes/airoutes"));

app.use(errorHandler);

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server started on port ${process.env.PORT || 5000}`);
});