import http from 'http';
import express, { Request, Response } from "express";
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from "cors";
import { Kafka } from 'kafkajs';
import connectDB from "./middleware/connectdb";
import profile from './models/profile';
import systemData from './models/systemData';
import submissionSchema from './models/submission';
import judgerNodeModel from './models/judgerNode';

const jsonwebtoken = require('jsonwebtoken')

require('dotenv').config({ path: ".env.local" })

const PORT = process.env.PORT || 3002;

const app = express();
const server = http.createServer(app);

const kafka = new Kafka({
   "clientId": "submissionProducer",
   "brokers": [`${process.env.BROKER_URL}`]
});   

const producer = kafka.producer();

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
   socket.on('health', (message: any) => {
      socket.emit('health', "alive");
   })

   socket.on('submissionStatus', async (submissionId: any) => {
      try {
         const dbSubmission = await submissionSchema.findOne({
            submissionId: submissionId
         });

         if (dbSubmission) {
            const result = {
               submissionId: submissionId,
               submissionStatus: dbSubmission.status
            }
            
            socket.emit('submissionStatus', result);
         } else {
            const result = {
               submissionId: submissionId,
               submissionStatus: "NA"
            }
            socket.emit('submissionStatus', result);            
         }    
      } catch (error) {
         console.log("Error occurred in RCE-JUDGE");
         console.log(error);
      }
   })

   socket.on('submitCode', async (message: string) => {
      try {
         const sentData = JSON.parse(message);
         const sentUserDetails = jsonwebtoken.verify(sentData.jwt, process.env.JWT_KEY);
         
         const dbUserDetails = await profile.findOne({ email: sentUserDetails.email })
         const dbSystemData = await systemData.findOne({ title: "submissions" });

         if (!dbUserDetails) {
            socket.emit('submitCode', "Profile doesn't exist.");
            return;
         }
         
         if (sentUserDetails.loginTime !== dbUserDetails.loginTime) {
            socket.emit('submitCode', "Session expired.")
            return;
         }

         const submissionId = dbSystemData.nextSubmissionId;
         const problemTitle = sentData.problemTitle;

         const nodeData: any = await judgerNodeModel.aggregate([
            {
               $match: {
                  title: `${problemTitle}`
               }
            },

            {
               $limit: 1
            }
         ])

         const programInput = nodeData[0].input;
         const programExpectedOutput = nodeData[0].output;
         const programDriverHead = nodeData[0].driverHead;
         const programDriverMain = nodeData[0].driverMain;
         const programTimeLimit_sec = nodeData[0].timeLimit_sec;
         const programMemoryLimit_kb = nodeData[0].memoryLimit_kb;

         const date = new Date();

         const judgeData = {
            userEmail: sentUserDetails.email,
            problemTitle: problemTitle,
            submissionId: submissionId,
            code: sentData.code ? sentData.code : "",
            lang: "cpp",
            input: programInput,
            expectedOutput: programExpectedOutput,
            driverHead: programDriverHead,
            driverMain: programDriverMain,
            timeLimit_sec: programTimeLimit_sec,
            memoryLimit_kb: programMemoryLimit_kb,
            time: date.toISOString()
         }
         
         await producer.send({
            "topic": `Submission`,
            "messages": [
               {
                  "value": JSON.stringify(judgeData),
                  "partition": sentData.lang
               }
            ]
         })

         socket.emit('submissionStatus', {
            submissionId: submissionId,
            submissionStatus: "NA"
         });
      } catch (error) {
         socket.emit('submitCode', "FORB");
      }
   });

   // Handle disconnect
   socket.on('disconnect', () => {
      console.log('A user disconnected');
   });
});

server.listen(PORT, async () => {
   try {
      await connectDB();
      await producer.connect();
      console.log(`Judge Server is running on port ${PORT}`);
   } catch (error)  {
      console.log("Error starting the server.");
      console.log(error);
   }
});