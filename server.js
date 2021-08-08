import express from 'express'
import cors from 'cors'
import Pusher from 'pusher'
import postModel from './models/post.js'
import profileRoute from './routes/profileRoute.js'
import postRoute from './routes/postRoute.js'
import methodOverride from 'method-override'
import dotenv from 'dotenv'
import {conn} from './db/db.js'

dotenv.config()

// app config
const app = express()
const port = process.env.PORT || 5000;


//middle ware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(methodOverride('_method'))

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.use('/profile', profileRoute)
app.use('/post', postRoute)

// listener
app.listen(port, () => console.log(`listening on localhost: ${port}`))