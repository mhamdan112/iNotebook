const express= require('express');
const router = express.Router();
var fetchuser = require('../middleware/fetchuser');
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');
//Route 1: Get all the notes using get"/api/notes/fetchnotes" endpoint. Login required
router.get('/fetchnotes', fetchuser,async (req, res) => {
    try{
        const notes= await Notes.find({user:req.user.id});
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Route 2: Add a new note using post"/api/notes/addnote" endpoint. Login required
router.post('/addnote', fetchuser,[
    body('title','Enter a valid title').isLength({ min: 3 }),
    body('description','Description must be at least 5 characters long').isLength({ min: 5 })
],async (req, res) => {
    try{
    const {title,description,tag}=req.body;
    //checking for errors in the request body
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    //creating a new note
    const note=new Notes({
        title,description,tag,user:req.user.id
    })
    const savedNote=await note.save();
    res.json(savedNote);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }});
//Route 3: Update an existing note using put"/api/notes/updatenote/:id" endpoint. Login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try{
     const {title,description,tag}=req.body;
     //creating a new note object
     let newNote={};
     if(title){newNote.title=title};
     if(description){newNote.description=description};
     if(tag){newNote.tag=tag};
      //finding the note to be updated and updating it
     let note = await Notes.findById(req.params.id);
     if(!note){return res.status(404).send("Not Found")};
     //Allowing only the user who created the note to update it
     if(note.user.toString()!==req.user.id){
        return res.status(401).send("Not Allowed");
     }
     //updating the note
     note=await Notes.findByIdAndUpdate(req.params.id,{$set:newNote},{new:true});
     res.json({note});
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }});
    //Route 4: Delete an existing note using delete"/api/notes/deletenote/:id" endpoint. Login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try{
        //finding the note to be deleted and deleting it
    let note = await Notes.findById(req.params.id);
     if(!note){return res.status(404).send("Not Found")};
        //Allowing only the user who created the note to delete it
        if(note.user.toString()!==req.user.id){
            return res.status(401).send("Not Allowed");
        }
        //deleting the note
        note=await Notes.findByIdAndDelete(req.params.id);
        res.json({"Success":"Note has been deleted",note:note});
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }});
    //Router to Search note from tag or title or description using GET /api/notes/searchnote or GET /api/notes/searchnote/:query. Login required
router.get('/searchnote', fetchuser, async (req, res) => {
    try{
        const query = String(req.query.q || req.query.query || '').trim();
        if (!query) {
            return res.json([]);
        }

        const notes = await Notes.find({
            user: req.user.id,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tag: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/searchnote/:query', fetchuser, async (req, res) => {
    try{
        const query = String(req.params.query || '').trim();
        if (!query) {
            return res.json([]);
        }

        const notes = await Notes.find({
            user: req.user.id,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tag: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;