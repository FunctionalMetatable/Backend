const db = require('monk')('localhost/flagclicked')
const auth = require('./auth.js')
let tutorials = db.get('tutorials')

tutorials.createIndex('id', { unique: true })
var Tutorials = {}

Tutorials.raw = tutorials; // declare raw db

Tutorials.get = async function(id) {
    var tutorial = {}

    try {
        tutorial = await tutorials.findOne({ id })
    } catch(ex) {
        tutorial = null
    }

    return tutorial
}

Tutorials.new = async function(body, author) {
    let allTutorials = await tutorials.find()
    let tutorial = {
        id: (allTutorials.length + 1),
        author,
        tags: [],
        body,
        meta: {
            created: {
                time: Date.now(),
                user: author
            },
            edited: {
                time: Date.now(),
                user: author
            },
            visibillity: true
        }
    }
    await tutorials.insert(tutorial)

    return tutorial
}

Tutorials.edit = async function(body, id, user) {
    let tutorial = await Tutorials.get(id)
    var editor = await auth.getUser(user)

    if (editor.id !== tutorial.author.id && !editor.admin) {
        throw 'User cannot edit this tutorial!'
    }

    await tutorials.update({ id }, { $set: { body, "meta.edited.user": editor, "meta.edited.time": Date.now()} })

}

Tutorials.setTutorialVisibillity = async function(id, authorAsCommitter, visibillity) {
    let tutorials = await Tutorials.get(id)
    let editor = await auth.getUser(authorAsCommitter)
    
    await tutorials.update({ id }, { $set: { "meta.visibillity": visibillity, "meta.edited.user": editor, "meta.edited.time": Date.now() } })
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = Tutorials
