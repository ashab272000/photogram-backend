import Router from 'express'
import Post from '../models/post.js';
import Profile from '../models/profile.js'

const router = Router();

// Get all the profiles
router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find(
            {},
            {
                uid:1, username:1, userAvatar:1, createdAt:1, 
                numOffollowers: {$size: '$followers'}, 
                numOffollowing: {$size: '$following'}
            } 
        )
        console.log(profiles)
        return res.json({
            success: true,
            data: profiles
        })
    } catch (err) {
        res.status(400).json('Error: ' + err)
    }
})

router.post('/add', async (req, res) => {
    const body = req.body;
    console.log('profile/add')
    console.log(body);
    
    try {
        const newProfile = new Profile({
            uid: body.uid,
            username: body.username,
            userAvatar: body.userAvatar, 
        })

        const response = {
            success: true,
            data: newProfile,
        }


        await newProfile.save()

        return res.json(response);
    } catch (err) {
        return res.status(400).json({success: false, error: err})
    }
})

router.get('/:uid', async (req, res) => {
    try {
        const result = await Profile.findOne(
            {uid: req.params.uid},
            {
                uid:1, username:1, userAvatar:1, createdAt:1, desc:1,
                numOfFollowers: {$size: '$followers'}, 
                numOfFollowing: {$size: '$following'},
            } 
        )

        const numOfPosts = await Post.countDocuments({uid: req.params.uid})
        const profile = Object.assign({}, result._doc, {numOfPosts: numOfPosts})

        return res.json({
            success: true,
            data: profile,
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success:false,
            error: error,
        })
    }
})

router.get('/exists/:uid', async (req,res) => {
    try {
        const profileExists = await Profile.exists({uid: req.params.uid})
        return res.json({
            success: true,
            data: profileExists,
        })
    } catch (error) {
        return res.status(400).json({
            success:false,
            error: error,
        })
    }
})

// router.delete('/:id', async (req, res) => {
//     try {
//         const deletedDoc = await Profile.findOneAndDelete({'uid': req.params.id})
//         console.log(deletedDoc)
//         return res.json({
//             success:true,
//             data: deletedDoc,
//         })
        
//     } catch (err) {
//         return res.json({
//             success:false,
//             error: err,
//         })
//     }
// })

// router.post('/numOfFollowers')
// router.post('/numOfFollowing')
// @route POST
// @desc Allows a user to follow another user
// @require (user id, followed user id)
router.post('/followProfile', async (req, res) => {
    try {
        const body = req.body;
        //find user and follow profile
        // Uses addSet To prevent duplicates
        await Profile.updateOne(
            {uid: body.uid},
            { $addToSet : { following : body.followUid}})
        await Profile.updateOne(
            {uid: body.followUid}, 
            {$addToSet : { followers : body.uid}})
            
        // Return as success
        return res.json({
            success:true,
            data: true,
        })
        
    } catch (error) {
        return res.json({
            success:false,
            error: error,
        })
    }
})

// @route delete
// @desc Allows a user to unfollow another user
// @require (user id, followed user id)
router.post('/unFollowProfile', async (req, res) => {
    try {
        const body = req.body;
        console.log(body);
        // find and update the users
        await Profile.findOneAndUpdate(
            {uid: body.uid},
            { $pull: {following: body.followUid }}
        )
        await Profile.findOneAndUpdate(
            {uid: body.followUid},
            { $pull: {followers: body.uid }}
        )
        return res.json({
            success:true,
            data: true,
        })
    } catch (error) {
        return res.json({
            success:false,
            error: error,
        })
    }
})

// @route GET
// @desc checks if the user with userId is following user with followUserId
router.get('/isFollowing/:userId/:followUserId', async (req, res) => {
    try {
        const result = await Profile.exists({uid: req.params.userId, following: req.params.followUserId})
        return res.json({
            success: true,
            data:result,
        })
    } catch (error) {
        return res.json({
            success:false,
            error: error,
        })
    }
})

export default router;