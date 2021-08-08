import Router from 'express'
import { upload } from '../middleware/storage.js'
import Post from '../models/post.js'
import Profile from '../models/profile.js'
import {gfs} from '../db/db.js'
import Comment from '../models/comment.js'
import mongoose from 'mongoose'

const router = Router()


router.get('/', async (req,res) => {
    try {
        const posts = await Post.find({})
        console.log(posts)
        return res.json({
            success:true,
            data:posts,
        })
    } catch (err) {
        res.status(400).json('Error: ' + err)
    }
})



// @route POST /:postId
// @desc gets a post
router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
         
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

    try {
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
        const result = await Post.aggregate(
            [
                {$match:{ _id: mongoose.Types.ObjectId(req.params.postId)}}, 
                // {$project: { _id:0, comments: { $slice: ['commments', 1] }}}
                {$project: {comments: {$slice : ['$comments', parseInt(req.params.start), parseInt(req.params.limit)] }}}
            ])

        return res.json({
            success:true,
            data:result,
        })
     } catch (error) {
         return res.status(400).json({
             success:false,
             error:error,
         })
     }
})
export default router;