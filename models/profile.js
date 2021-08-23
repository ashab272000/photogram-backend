import mongoose from "mongoose";
import { reqString } from "./types.js";
import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching'

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
// Adds the fuzzy searching to the username field
profileSchema.plugin(mongoose_fuzzy_searching, { fields: ['username']})
export default mongoose.model('profile', profileSchema);
export {
    profileSchema,
}

