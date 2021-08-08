import mongoose from 'mongoose'
import { reqString } from './types.js'

const commentSchema = mongoose.Schema({
    comment: reqString,
    uid:reqString,
},{timestamps:true})

export default mongoose.model('comment', commentSchema)
export { commentSchema }