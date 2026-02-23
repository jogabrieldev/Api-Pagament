import dotenv from 'dotenv';
import { Pool } from 'pg';


dotenv.config();
const pool = new Pool({
  user: process.env.USER_DB,
  host: process.env.HOST_DB,
  database: process.env.NAME_DB,
  password: process.env.PASS_DB,
  port: Number(process.env.PORT_DB) || 5432,
  max: 20,
  idleTimeoutMillis: 30000
});

export default pool;