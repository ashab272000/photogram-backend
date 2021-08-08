import Router from 'express'
import Profile from '../models/profile.js'

const router = Router();

// Get all the profiles
router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find({})
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
        const profile = await Profile.findOne({uid:req.params.uid})
        return res.json({
            success: true,
            data: profile,
        })
    } catch (error) {
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

router.route('/:id').delete(async (req, res) => {
    try {
        const deletedDoc = await Profile.findOneAndDelete({'uid': req.params.id})
        console.log(deletedDoc)
        return res.json({
            success:true,
            data: deletedDoc,
        })
        
    } catch (err) {
        return res.json({
            success:false,
            error: err,
        })
    }
})

export default router;