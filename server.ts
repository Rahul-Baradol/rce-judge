import express, { Request, Response } from "express";
import cors from "cors";

require('dotenv').config({ path: ".env.local" })

const app = express();

app.use(cors());

app.get('/health', (req: Request, res: Response) => {
   res.status(200).json({
      status: "alive" 
   });
})

app.get('/', (req: Request, res: Response) => {
   res.status(200).send("Judge Service for remote-code-executor");
})

app.listen(process.env.PORT, () => {
   console.log(`Judge Service running on port ${process.env.PORT}`);
});