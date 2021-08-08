import crypto from 'crypto'
import path from'path'
// import GridFsStorage from 'multer-gridfs-storage'
import dotenv from 'dotenv'
import multer from 'multer'
import MulterGridfsStorage from 'multer-gridfs-storage'

dotenv.config()

// Creating the storage engine

const storage = new MulterGridfsStorage.GridFsStorage({
        url: process.env.ATLAS_URI,
        file: (req, file) => {
            return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                filename: filename,
                bucketName: 'images'
                };
                resolve(fileInfo);
            });
            });
        }
    });

const upload = multer({storage})

export { storage ,upload }

