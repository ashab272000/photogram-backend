import mongoose from "mongoose";
import { reqString } from "./types.js";

const profileSchema = mongoose.Schema({
    uid: reqString,
    username: reqString,
    userAvatar: String, 
    desc:String,
    following: [String],
    followers: [String]
}, {
    timestamps:true,
});

export default mongoose.model('profile', profileSchema);
export {
    profileSchema,
}

