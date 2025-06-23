const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const dbPath = path.resolve('task.json');

app.post('/tasks',(req,res)=>{
    const toCreateTask = req.body

    if(!toCreateTask.title || !toCreateTask.description || typeof toCreateTask.completed !== 'boolean'){
        return res.status(400).send();
    }

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read data from DB');
        }

        const jsonData = JSON.parse(data.toString());        

        toCreateTask.id = jsonData.tasks.length + 1;

        jsonData.tasks = [...jsonData.tasks,toCreateTask];

        const bufferData = Buffer.from(JSON.stringify(jsonData));

        fs.writeFile(dbPath,bufferData,(err,data)=>{
            if(err){
                console.log('Unable to write file in tasks');
                return res.status(500).send({ error: 'Unable to read file' });
            }
            console.log('Task saved successfully');
        });
    });

    return res.status(201).send();
});

app.get('/tasks',(req,res)=>{
    const query = req.query;

    fs.readFile(dbPath,(err,data)=>{

        if (err) {
            console.log('Unable to read file');
            return res.status(500).send({ error: 'Unable to read file' });
        }

        let tasksObj;
        try {
            tasksObj = JSON.parse(data.toString());
        } catch (e) {
            return res.status(500).send({ error: 'Malformed JSON in DB' });
        }

        // Ensure tasksObj.tasks is always an array
        if (!Array.isArray(tasksObj.tasks)) {
            tasksObj.tasks = [];
        }
        
        let filteredTasks = tasksObj.tasks;

        if(query.completed !== undefined){
            const completedBool = query.completed === 'true';
            filteredTasks = tasksObj.tasks.filter(t=>t.completed===completedBool);            
        }

        if(query.sort!==undefined){
            const direction = query.sort === 'asc' ? 1 : -1;

            filteredTasks = tasksObj.tasks.sort((t1,t2)=>{
                const date1 = new Date(t1.createdAt);
                const date2 = new Date(t2.createdAt);
                return (date1-date2) * direction;
            });
        }

        tasksObj.tasks = filteredTasks;

        return res.status(200).send(tasksObj);
    });
});

app.get('/tasks/:id',(req,res)=>{
    const taskId = req.params.id;

    if(isNaN(taskId)){
        return res.status(400).send();
    }

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
            return res.status(500).send({ error: 'Unable to read file' });
        }

        const unFilteredData = JSON.parse(data.toString());

        const requestedTask = unFilteredData.tasks.find(t=>t.id===Number(taskId));
        if(!requestedTask){
            return res.status(404).send();
        }

        return res.send(requestedTask);
    });
});

app.get('/tasks/priority/:level',(req,res)=>{
    const taskLevel = req.params.level;

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
            return res.status(500).send({ error: 'Unable to read file' });
        }

        const unFilteredData = JSON.parse(data.toString());

        const requestedTasks = unFilteredData.tasks.filter(t=>t.priority===taskLevel);

        return res.send(requestedTasks);
    });
});



app.put('/tasks/:taskId',(req,res)=>{
    const toUpdateTaskId = Number(req.params.taskId);
    const taskToUpdate = req.body;

    if(!taskToUpdate.title || !taskToUpdate.description || typeof taskToUpdate.completed !== 'boolean'){
        return res.status(400).send();        
    }

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
            return res.status(500).send({ error: 'Unable to read file' });
        }

        const unFilteredData = JSON.parse(data.toString());

        const requestedTaskIndex = unFilteredData.tasks.findIndex(t=>t.id===toUpdateTaskId);

        if(requestedTaskIndex===-1){
            return res.status(404).send();
        }

        taskToUpdate.id = unFilteredData.tasks[requestedTaskIndex].id;

        unFilteredData.tasks.splice(requestedTaskIndex,1,taskToUpdate);

        const bufferData = Buffer.from(JSON.stringify(unFilteredData));

        fs.writeFile(dbPath,bufferData,(err,data)=>{
            if(err){
                console.log('Unable to write file in tasks');
                return res.status(500).send({ error: 'Unable to read file' });
            }
            console.log('Task updated successfully');
        });

        return res.send(unFilteredData);
    });
});

app.delete('/api/v1/tasks/:id',(req,res)=>{
    const toDeleteTaskId = Number(req.params.id);

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
            return res.status(500).send({ error: 'Unable to read file' });
        }

        const unFilteredData = JSON.parse(data.toString());

        const requestedTaskIndex = unFilteredData.tasks.findIndex(t=>t.id===toDeleteTaskId);

        if(requestedTaskIndex===-1){
            return res.status(404).send();
        }

        unFilteredData.tasks.splice(requestedTaskIndex,1);

        const bufferData = Buffer.from(JSON.stringify(unFilteredData));

        fs.writeFile(dbPath,bufferData,(err,data)=>{
            if(err){
                console.log('Unable to write file in tasks');
                return res.status(500).send({ error: 'Unable to read file' });
            }
            console.log('Task deleted successfully');
        });

        return res.status(200).send();
    });
});

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});



module.exports = app;