import express from 'express';
import Comment from '../models/comment.js';

const commentRouter = express.Router();

// Créer un nouveau commentaire
commentRouter.post('/addComment', async (req, res) => {
        const comment = req.body;
        const { data, error } = await supabase
            .from('Comments')
            .insert(comment)
            .select()

            if(error){
                console.log('Error during creating comment:', error)
            }

            if(data){
                res.status(200).json({message: 'Comment created successfuly', data})
            }
});

// Obtenir tous les commentaires
commentRouter.get('/getAllComments', async (req, res) => {
    const { data, error } = await supabase
    .from('Comments')
    .select('*')

    if(error){
        console.log('Error during selecting all comments:', error)
    }

    if(data){
        res.status(200).json({message: 'All comments selected successfuly', data})
    }
});

// Obtenir un commentaire par ID
commentRouter.get('/getComment/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('Comments')
        .select('*')
        .eq('id', req.params.id)

        if(error){
            console.log('Error during getting comment:', error)
        }

        if(data){
            res.status(200).json({message: '^Comment selected successfuly', data})
        }
});

// Mettre à jour un commentaire
commentRouter.put('/updateComment/:id', async (req, res) => {
    const newComment = req.body
    const { data, error } = await supabase
        .from('Comments')
        .update(newComment)
        .select()

        if(error){
            console.log('Error during updating comment:', error)
        }

        if(data){
            res.status(200).json({message: 'Comment updated successfuly', data})
        }
});

// Supprimer un commentaire
commentRouter.delete('/deleteComment/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('Comments')
        .delete()
        .eq('id', req.params.id)

        if(error){
            console.log('Error during deleting comment:', error)
        }

        if(data){
            res.status(200).json({message: 'Comment deleted successfuly', data})
        }
});

export default commentRouter;