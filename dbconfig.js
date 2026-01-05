import mongodb from 'mongodb';
import { MongoClient } from 'mongodb';
import 'dotenv/config';


const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster2.ich2lzl.mongodb.net/${process.env.DB_NAME}?appName=Cluster2`;

export const collectionName = "todos";

const client = new MongoClient(url);
let cachedDb = null; 

export const connection = async () => {

    if (cachedDb) {
        console.log("Using cached DB connection.");
        return cachedDb;
    }

    try {
        const clientInstance = await client.connect(); 
        
    
        const db = clientInstance.db(process.env.DB_NAME); 
 
        cachedDb = db; 
        console.log("New database connection established.");
        return db;
    } catch (error) {
        console.error("Failed to connect to the database:", error);
 
    }
}