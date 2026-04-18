const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");
const projectRoutes = require("./routes/projectroutes");
const taskRoutes = require("./routes/taskroutes");
const snippetRoutes = require("./routes/snippetroutes");
const vaultRoutes = require("./routes/vaultroutes");
const { errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();
connectDB();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/snippet", snippetRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/ai", require("./routes/airoutes"));

app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});