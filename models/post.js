import mongoose from 'mongoose'
import {commentSchema} from './comment.js'
import { reqString } from './types.js'

const postSchema = mongoose.Schema({
    caption: String,
    image: reqString,
    comments: [commentSchema],
    likedBy: [String],
    uid: reqString,
}, {timestamps:true})

export default mongoose.model('post', postSchema)
export {
    postSchema,
}