import express from 'express';
import Like from '../models/like.js';

const router = express.Router();

// Ajouter un like
router.post('/', async (req, res) => {
    try {
        const { user, post } = req.body;
        const existingLike = await Like.findOne({ user, post });

        if (existingLike) {
            return res.status(400).json({ error: 'Vous avez déjà aimé ce post.' });
        }

        const like = new Like({ user, post });
        await like.save();
        res.status(201).json(like);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Supprimer un like
router.delete('/:userId/:postId', async (req, res) => {
    try {
        const { userId, postId } = req.params;
        const like = await Like.findOneAndDelete({ user: userId, post: postId });

        if (!like) {
            return res.status(404).json({ error: 'Like non trouvé' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtenir le nombre de likes pour un post
router.get('/count/:postId', async (req, res) => {
    try {
        const count = await Like.countDocuments({ post: req.params.postId });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtenir tous les likes d'un utilisateur
router.get('/user/:userId', async (req, res) => {
    try {
        const likes = await Like.find({ user: req.params.userId }).populate('post');
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;