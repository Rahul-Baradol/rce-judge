import http from 'http';
import express, { Request, Response } from "express";
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from "cors";
import connectDB from "./middleware/connectdb";
import profile from './models/profile'
import systemData from './models/systemData'

const jsonwebtoken = require('jsonwebtoken')

require('dotenv').config({ path: ".env.local" })

const PORT = process.env.PORT || 3002;

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
   cors: {
      origin: "*"
   }
});

app.use(cors());

app.get('/health', (req: Request, res: Response) => {
   res.status(200).json({
      status: "alive"
   });
})

app.get('/', (req: Request, res: Response) => {
   res.status(200).send("Judge Service for remote-code-executor");
})

io.on('connection', async (socket: Socket) => {
   await connectDB();

   // Handle incoming messages from clients
   socket.on('message', async (message: string) => {
      try {
         const sentData = JSON.parse(message);
         const sentUserDetails = jsonwebtoken.verify(sentData.jwt, process.env.JWT_KEY);
         
         const dbUserDetails = await profile.findOne({ email: sentUserDetails.email })
         const dbSystemData = await systemData.findOne({ title: "submissions" });

         if (!dbUserDetails) {
            socket.emit('message', "Profile doesn't exist.");
            return;
         }

         if (sentUserDetails.sessionKey !== dbUserDetails.sessionKey) {
            socket.emit('message', "Session expired.")
            return;
         }

         const submissionID = dbSystemData.nextSubmissionId;

      } catch (error) {
         console.log("Error occurred");
         console.log(error);
      }
   });

   // Handle disconnect
   socket.on('disconnect', () => {
      console.log('A user disconnected');
   });
});

server.listen(PORT, () => {
   console.log(`Judge Server is running on port ${PORT}`);
});