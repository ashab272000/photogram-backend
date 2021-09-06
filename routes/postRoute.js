import Router from 'express'
import { upload } from '../middleware/storage.js'
import Post from '../models/post.js'
import Profile from '../models/profile.js'
import {conn, gfs} from '../db/db.js'
import Comment from '../models/comment.js'
import mongoose from 'mongoose'

const router = Router()

const getUniqueValues = (arr) => {
  var newArr = [];
  for (const val of arr) {
    if (!newArr.includes(val)) {
        newArr.push(val);
      }  
  }
  return newArr;
}

// @route GET 
// @desc Gets all the latest post
router.get('/', async (req,res) => {
    try {
        const posts = await Post.find({}, {uid:1, caption:1, image:1, createdAt:1})

        const userIds = posts.map((post) => {
            return post.uid
        })

        const uniqueUserIds = getUniqueValues(userIds)

        const userValues = await Profile.find(
            {uid: { $in: uniqueUserIds}},
            {uid:1, username:1, userAvatar:1}
        )  

        console.log("User values")
        console.log(userValues)

        for (let i = 0; i < userIds.length; i++){
            let uid = userIds[i]
            let username='';
            let userAvatar='';

            for (const val of userValues) {
                if(uid == val.uid){
                    username =val.username;
                    userAvatar =val.userAvatar;
                    break;
                }                
            }

            // posts[i].username = username
            // posts[i].userAvatar = userAvatar


            posts[i] = {
                _id: posts[i]._id,
                uid,
                username,
                userAvatar,
                caption: posts[i].caption,
                image: posts[i].image,
                createdAt: posts[i].createdAt,
            }
        }
    

        return res.json({
            success:true,
            data:posts,
        })
    } catch (err) {
        res.status(400).json('Error: ' + err)
    }
})

// @route GET
// @desc gets all the followed profiles post
router.get('/profile/followingPosts/:userId/:limit/:date', async (req, res) => {
    try {
        const date = new Date(parseInt(req.params.date))
        // Get all the users that are being followed by the user
        const following = (await Profile.findOne(
            {uid: req.params.userId},
            {following: 1})).following

        const users = [...following, req.params.userId]
        // Get all the post from followed users
        const posts = await Post
        .find({ uid: { $in: users}, createdAt: {$lt: date}},
            {uid:1, caption:1, image:1, createdAt:1, 
            numOfLikes: {$size: "$likedBy"}, numOfComments: {$size: '$comments'}})
        .sort({ createdAt: -1})
        .limit(parseInt(req.params.limit))

        // Get all the names and user avatar of the followed user
        const userValues = await Profile.find(
            {uid: { $in: users}},
            {uid:1, username:1, userAvatar:1}
        )  

        for (let i = 0; i < posts.length; i++){
            let uid = posts[i].uid
            let username='';
            let userAvatar='';

            for (const val of userValues) {
                if(uid == val.uid){
                    username =val.username;
                    userAvatar =val.userAvatar;
                    break;
                }                
            }

            posts[i] = Object.assign({}, posts[i]._doc, {username,userAvatar})
        }
        
        return res.json({
            success: true,
            data: posts
        })
        
    } catch (error) {
        console.log("Error in getFollowingPosts")
        console.log(error)
        return res.json({
            success: false,
            error: error,
        })
        
    }
})

// @route GET
// @desc Gets all the trending posts
router.get('/trending/:limit/:date', async (req, res) => {
    try {
        const date = new Date(parseInt(req.params.date))

        // Get all the post
        // Calculate the trending score by the following formula
        // likes/daysSinceCreation
        // First sort by the likes (desc)
        // Then sort by the date (desc)
        // 
        const limit = parseInt(req.params.limit)
        const posts = await Post
        .aggregate([
            {$match: {createdAt: {$lt: date}},},
            {$addFields: {
                trendScore: {
                    $divide : [{$size: { $ifNull: ["$likedBy", []]}},
                    { $divide: [ {$subtract : [new Date(), "$createdAt"]}, 3600000 ]}]
                }
            }},
            {$project: {uid:1, caption:1, image:1, createdAt:1,
                numOfLikes: {$size: "$likedBy"},
                numOfComments: {$size: '$comments'},
                trendScore: 1,
            },},
            {$sort : {
                trendScore: -1,
            }},
            {$limit: limit}
        ],)

        // Get all the names and user avatar of the followed user
        const userIds = posts.map((post) => {
            return post.uid
        })

        const uniqueUserIds = getUniqueValues(userIds)

        const userValues = await Profile.find(
            {uid: { $in: uniqueUserIds}},
            {uid:1, username:1, userAvatar:1}
        )  

        for (let i = 0; i < posts.length; i++){
            let uid = posts[i].uid
            let username='';
            let userAvatar='';

            for (const val of userValues) {
                if(uid == val.uid){
                    username =val.username;
                    userAvatar =val.userAvatar;
                    break;
                }                
            }
            posts[i] = Object.assign({}, posts[i], {username,userAvatar})
        }
        
        return res.json({
            success: true,
            data: posts
        })
        
    } catch (error) {
        console.log("Error in getTrendingPost")
        console.log(error)
        return res.json({
            success: false,
            error: error,
        })
        
    }
})

// @route GET
// @desc gets all the post based on the username
router.get('/profile/:userId/:limit/:date', async (req, res) => {
    try {
        const date = new Date(parseInt(req.params.date))
        const posts = await Post
        .find({ uid: req.params.userId, createdAt: {$lt: date}},
            {uid:1, caption:1, image:1, createdAt:1, 
            numOfLikes: {$size: "$likedBy"}, numOfComments: {$size: '$comments'}})
        .sort({ createdAt: -1})
        .limit(parseInt(req.params.limit))
        
        return res.json({
            success: true,
            data: posts
        })
        
    } catch (error) {
        
        return res.json({
            success: false,
            error: error,
        })
        
    }

    
    
})



// @route POST /:postId
// @desc gets a post
router.get('/:postId', async (req, res) => {
    try {
        // const post = await Post.findById(req.params.postId)
        
        let post = (await Post.aggregate([
            {$match: { _id: mongoose.Types.ObjectId(req.params.postId)}},
            {$project: {uid:1, caption:1, image:1, createdAt:1}}
        ]))[0]
         
        const userValues = (await Profile.aggregate([
            {$match: { uid: post.uid }},
            {$project: {uid:1, username:1, userAvatar:1}}
        ]))[0]

        post.username = userValues.username
        post.userAvatar = userValues.userAvatar

        
        
        res.json({
            success: true,
            data: post,
        })
        
    } catch(err) {
        res.status(400).json('Error: ' + err)
    }
})

// @route GET /image/:imageId
// @desc gets an image with the imageid
router.get('/image/:filename', async (req, res) => {
    try {
        gfs.files.findOne({filename:req.params.filename}, (err, file) => {
            console.log(file);
            if(!file || file.length === 0) {
                return res.status(400).json('Error: ' + err)
            }
            
            const readstream = gfs.createReadStream(file.filename)
            readstream.pipe(res)
        })     
        
        
        
    } catch (err) {
        
        return res.status(400).json('Error: ' + err)
    }
})

// @route POST /add
// @desc adds a post 
router.post('/add', upload.single('image') ,async (req, res, next) => {
    try {
        const body = req.body;

        const newPost = new Post({
            caption: body.caption,
            image: req.file.filename,
            comments: [],
            likedBy: [],
            uid: body.uid,
        });

        const response = {
            success: true,
            data: newPost,
        }

        await newPost.save((error) => {
            if(error != null){
                const errorRes = {
                    success: false,
                    err: error,
                }
                console.log("Error while saving")
                console.log(errorRes)

            }else {
                console.log("Saved")
            }
        })

        return res.json(response);
    } catch (err) {

        return res.status(400).json({success: false, error: err})
    }   
}, )

router.route('/addcomment').post(async (req, res) => {    
    try {
        const body = req.body;
        const post = await Post.findById(body.postId);
    
        const newComment = new Comment({
            postId: body.postId,
            comment: body.comment,
            uid: body.uid
        })
    
        console.log(post)
        post.comments.push(newComment);
        await post.save()
        return res.json({
            success: true,
            data: post,
        });
    } catch (err) {
        return res.status(400).json({success: false, error: err})
    }   
})

router.post('/addLike', async (req, res)=> {
    try {
        const body = req.body;
        console.log(body)
        const post = await Post.findById(body.postId);
    
        console.log(post)
        if(!post.likedBy.includes(body.uid)){
            post.likedBy.push(body.uid)
            await post.save()
            return res.json({
                success: true,
                data: post,
            });
        }else {
            return res.json({
                success: false,
                data: post,
            });            
        }
    } catch (err) {
        return res.status(400).json({success: false, error: err})
    }  
})

router.post('/deleteImage', async (req, res) => {
    try {

        // const body = req.body;
        // console.log("Printing Body")
        // console.log(body)
        // const file = await gfs.find({filename: body.image})
        // console.log("Printing file that was deleted")
        // console.log(file)
        // const deletedFile = await gfs.delete(file._id);
        // console.log(deletedFile)
        const files = conn.db.collection('images.files')
        const file = await files.findOneAndDelete({filename: req.body.image})
        console.log("printing File")
        console.log(file)
        const chunks = conn.db.collection('images.chunks');
        const result = await chunks.deleteMany({files_id: mongoose.Types.ObjectId(file.id)})
        console.log("deleted Count")
        console.log(result.deletedCount)

        return res.json({success: true, data: 'maybe'})
    } catch (error) {
        console.log(error)
        return res.status(400).json({success: false, error: error})
    }
})

router.post('/deletePost', async (req, res)=> {

    const body = req.body;
    try {
        // gfs.files.findOne({filename:req.params.filename}, (err, file) => {
        //     console.log(file);
        //     if(!file || file.length === 0) {
        //         return res.status(400).json('Error: ' + err)
        //     }
            
        //     const readstream = gfs.createReadStream(file.filename)
        //     readstream.pipe(res)
        // })     

        // const post = await Post.findById(body.postId)
        // post = await post.likedBy.pull(body.uid)
        // post.save()
        const post = await Post.findOneAndDelete({ _id: body.postId })
        if(post == null)
        {
            return res.json({success: true, data: null})
        }
        const files = conn.db.collection('images.files')
        const file = await files.findOneAndDelete({filename: post.image})
        console.log("printing File")
        console.log(file)
        const chunks = conn.db.collection('images.chunks');
        const result = await chunks.deleteMany({files_id: mongoose.Types.ObjectId(file._id)})
        console.log("deleted Count")
        console.log(result.deletedCount)

        return res.json({success: true, data: post})
    } catch (err) {
        return res.status(400).json({success: false, error: error})
    }  
})

router.post('/deleteLike', async (req, res)=> {

    const body = req.body;
    try {
        // const post = await Post.findById(body.postId)
        // post = await post.likedBy.pull(body.uid)
        // post.save()
        const post = await Post.findByIdAndUpdate(body.postId,{ $pull: {likedBy: body.uid }})
        return res.json({
            success: true,
            data: post,
        });
    } catch (err) {
        return res.status(400).json({success: false, error: err})
    }  
})

// Checks if a post is liked by a user
router.post('/isLikedByUser', async (req, res) => {
    const body = req.body;
    try {
        // const post = await Post.findById(body.postId)
        // post = await post.likedBy.pull(body.uid)
        // post.save()
        const post = await Post.exists({_id: body.postId, likedBy: body.uid })
        return res.json({
            success: true,
            data: post,
        });
    } catch (err) {
        return res.status(400).json({success: false, error: err})
    }  
    
})

// Get the number of likes
router.get('/numOfLikes/:postId', async (req, res) => {
    try {
       const result = await Post.aggregate([{$match: {_id: mongoose.Types.ObjectId(req.params.postId)}}, {$project: {likedBy: {$size: '$likedBy'}}}])
       return res.json({
           success:true,
           data:result[0].likedBy,
       })
    } catch (error) {
        return res.status(400).json({
            success:false,
            error:error,
        })
    }
})

// Get the number of comments
router.get('/numOfComments/:postId', async (req, res) => {
    try {
       const result = await Post.aggregate([{$match: {_id: mongoose.Types.ObjectId(req.params.postId)}}, {$project: {comments: {$size: '$comments'}}}])
       return res.json({
           success:true,
           data:result[0].comments,
        })
    } catch (error) {
        return res.status(400).json({
            success:false,
            error:error,
        })
    }
})

// Get the comments with start and limit
router.get('/comments/:postId/:start/:limit', async (req, res) => {
    try {
        // const result = await Post.aggregate([{$match: {_id: mongoose.Types.ObjectId(req.params.postId)}}, {$project: {comments: {$size: '$comments'}}}])
        const postResult = (await Post.aggregate(
            [
                {$match:{ _id: mongoose.Types.ObjectId(req.params.postId)}}, 
                // {$project: { _id:0, comments: { $slice: ['commments', 1] }}}
                {$project: {comments: {$slice : ['$comments', parseInt(req.params.start), parseInt(req.params.limit)] }}}
            ]))[0]
        
        
        // Get the user values, like the name and the photoURL
        console.log(postResult)
        const userIds = postResult.comments.map((comment) => {
            return comment.uid
        })

        const uniqueUserIds = getUniqueValues(userIds)
        console.log('Unique User Ids')
        console.log(uniqueUserIds)

        const userValues = await Profile.aggregate([
            {$match: { uid: { $in: uniqueUserIds}}},
            {$project: {uid:1, username:1, userAvatar:1}}
        ])  
        console.log("User Values")
        console.log(userValues)

        for (let i = 0; i <  userIds.length; i++){
            let uid = userIds[i]
            let username='';
            let userAvatar='';

            for (const val of userValues) {
                if(uid == val.uid){
                    username =val.username;
                    userAvatar =val.userAvatar;
                }                
            }

            postResult.comments[i].username = username;
            postResult.comments[i].userAvatar = userAvatar;

        }

        return res.json({
            success: true,
            data: postResult,
        })
     } catch (error) {
         console.log('postRoute.getComments Error')
         console.log(error)
         return res.status(400).json({
             success:false,
             error:error,
         })
     }
})


export default router;