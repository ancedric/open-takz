//Routes pour les publications
// --récupération des posts--
app.get('/get-posts', async (req, res) => {
    const sql = "SELECT * FROM posts";

    try {
        const results = await query(sql);

        if (results.length === 0) {
            console.log('Aucun post trouvé');
            return res.json({ fetched: false });
        }

        const postsWithComments = await Promise.all(results.map(async (row) => {
            const commentsQuery = "SELECT * FROM comments WHERE postId = ?";
            const comment = await query(commentsQuery, [row.id]);

            const comments = {
                comments: comment.map((com) => ({
                    id: com.id,
                    postId: com.postId,
                    author: com.author,
                    comment: com.comment,
                    likes: com.likes,
                    date: com.date,
                })),
            }
            const postData = {
                postId: row.id,
                shopId: row.shopId, 
                author: row.author,
                fileUrl: path.join('\\src', path.relative(path.join(__dirname, 'src', 'mall'), row.fileUrl)).replace(/mall\\/g, ''),
                catalogLink: row.catalogLink,
                content: row.content,
                likes: row.likes,
                tags: row.tags,
                date: row.date,
                comments: comments,
            };
        return postData;
    }));
      return res.json({ posts: postsWithComments }); // Assurez-vous de retourner les données dans le bon format
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    }
});

// --récupération d'un post--
app.get('/get-post/:id', async (req, res) => {
    const postId = req.params.id;
    const sql = "SELECT * FROM posts WHERE id = ?";

    try {
        const results = await query(sql, postId);

        if (results.length === 0) {
            console.log('Aucun post trouvé');
            return res.json({ fetched: false });
        }

        const post = results[0];
        const commentsQuery = "SELECT * FROM comments WHERE postId = ?";
        const comment = await query(commentsQuery, [post.id]);
            const postData = {
                postId: post.id,
                shopId: post.shopId,
                author: post.author,
                fileUrl: path.join('\\src', path.relative(path.join(__dirname, 'src', 'mall'), post.fileUrl)).replace(/mall\\/g, ''),
                catalogLink: post.catalogLink,
                content: post.content,
                likes: post.likes,
                tags: post.tags,
                date: post.date,
                comments: comment.map((com) => ({
                    id: com.id,
                    postId: com.postId,
                    userId: com.userId,
                    comAuthor: com.comAuthor,
                    comment: com.comment,
                    likes: com.likes,
                    date: com.date,})),
            };
            return res.json({post: postData});
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    }
});

// --récupération des posts associés à un utlisateur--
app.get('/get-posts/:id', async (req, res) => {
    const shopId = req.params.id;
    const sql = "SELECT * FROM posts WHERE shopId = ?";

    try {
        const results = query(sql, shopId);

        if (results.length === 0) {
            console.log('Aucun post trouvé');
            return res.json({ fetched: false });
        }

        const postsWithComments = await Promise.all(results.map(async (row) => {
            const commentsQuery = "SELECT * FROM comments WHERE postId = ?";
            const comment = query(commentsQuery, [row.id]);

            const comments = {
                comments: comment.map((com) => ({
                    id: com.id,
                    postId: com.postId,
                    userId: com.userId,
                    comAuthor: com.comAuthor,
                    comment: com.comment,
                    likes: com.likes,
                    date: com.date,
                })),
            }
            const postData = {
                postId: row.id,
                shopId: row.shopId,
                author: row.author,
                fileUrl: path.join('\\src', path.relative(path.join(__dirname, 'src', 'mall'), row.fileUrl)).replace(/mall\\/g, ''),
                catalogLink: row.catalogLink,
                content: row.content,
                likes: row.likes,
                tags: row.tags,
                date: row.date,
                comments: comments,
            };
        return postData;
    }));
      return res.json({ posts: postsWithComments }); // Assurez-vous de retourner les données dans le bon format
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    }
});

//route pour liker un post
app.post('/like', async (req, res) => {
    const postId = req.body.postId
    const userId = req.body.userId
    const query = "INSERT INTO savedposts (`userId`, `postId`) VALUES (?,?)"
    const values = [userId, postId]
    query(query, values, (err, data) => {
        if (err){
        console.log(err)
        return res.json({Message:"Erreur lors de l'ajout du like"})
    }
    console.log(data)
    return res.json(data)
    })
})

//route pour supprimer un like
app.delete('/dislike', (req, res) => {
    try {
        const query = "DELETE FROM savedposts WHERE postId = ? AND userId = ?" 
        const values = [
            req.body.PostId,
            req.body.userId,
        ]
    query(query, values, (err, data) => {
        if (err){
            console.log(err);
            return res.json({Message: 'Error while removing the post from the server'})
        }

        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.status(200).send('SavedPosts mis à jour avec succès')
        console.log(data);
        return res.json(data)
        });
    }catch(error){
    console.log(error);
    return res.status(500).json({Message: 'Erreur lors de la suppression du post des sauvagardes'})
    }
})

//route pour récupérer les likes
app.get('/get-likes', async (req, res) => {
    const sql = "SELECT * FROM savedposts";

    try {
        const results = query(sql);

        if (results.length === 0) {
            console.log('Aucun like');
            return res.json({ fetched: false });
        }

        const likes = results
      return res.json({ likes: likes }); // Assurez-vous de retourner les données dans le bon format
    } catch (error) {
        console.error('Erreur lors de la récupération des likes :', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des likes.' });
    }
})

// --creation des posts--
app.post('/create-post', upload.any('file'), async (req, res)=> {
    const uploadeFiles = req.files
    //parcourir les fichiers
    uploadeFiles.forEach((file) => {
        const fileName = `${req.session.id}_${Date.now()}_${file.originalname}`
        const fileUrl = file.path;

        try {
        // Déplacez le fichier vers le répertoire de destination
            const destinationFolderPath = path.resolve(__dirname, '..','frontend', 'src', 'assets', 'usersMedias')
            const destinationFilePath = path.join(destinationFolderPath, fileName)
            fs.copyFileSync(fileUrl, destinationFilePath)
    
            const createPostQuery = "INSERT INTO posts (`shopId`, `author`, `fileUrl`, `content`, `tags`, `date`) VALUES (?,?,?,?,?,?,?)"
            const values = [req.body.shopId, req.body.author, destinationFilePath, req.body.content, req.body.tags, new Date.toLocaleString()]
        
            query(createPostQuery, values, (err, data) => {
                if (err){
                    console.log(err);
                    return res.json({Message:"Erreur lors de l'enregistrement du post"})
                }
                return res.json(data)
            })
        }
        catch (error) {
            console.error('Erreur lors du déplacement du fichier :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors du téléchargement du fichier.' });
        }
    }) 
})

// --mise à jour des posts--
app.put('/posts/:id', (req, res) => {
    const postId =req.params.id
    const newLikeValue = req.body.likes

    const sql = "UPDATE posts SET likes = ? WHERE id = ?"
    query(sql, [newLikeValue, postId], (err, data) => {
        if (err){
            console.log(err)
            return res.json({Message:"Erreur lors de la mise à jour du post : ajout du like"})
        }
        else{
        return res.json({message: "Like ajouté avec succès", dtats: data})
        }
    })
})

//--Ajout des commentaires--
app.post('/comments', (req, res) => {
    const createCommentQuery = "INSERT INTO comments (`postId`, `userId`,`author`, `comment`, `date`) VALUES (?,?,?,?,?)"
    const values = [req.body.postId, req.body.userId, req.body.username, req.body.comment, Date.toLocaleString()]
    query(createCommentQuery, values, (err, data) => {
        if (err){
        console.log(err)
        return res.json({Message:"Erreur lors de l'ajout du commentaire"})
    }
    console.log(data)
    return res.json(data)
    })
})