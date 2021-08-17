import mongoose from 'mongoose'
import Grid from 'gridfs-stream'
//Init gfs 
let gfs;
// db config
const uri = process.env.ATLAS_URI;


mongoose.connect(uri, {
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology: true,
})
mongoose.set('useFindAndModify', false);

const conn = mongoose.connection;

conn.once('open', () => {
    console.log('DB Connected')
    // Connect gfs to db
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('images')
    
})

export { conn, gfs }