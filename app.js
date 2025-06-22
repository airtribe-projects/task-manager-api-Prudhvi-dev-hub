const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const dbPath = path.resolve('task.json');

app.post('/api/v1/tasks',(req,res)=>{
    const toCreateTask = req.body

    if(!toCreateTask.title || !toCreateTask.description){
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
            }
            console.log('Task saved successfully');
        });
    });

    return res.send(toCreateTask);
});

app.get('/api/v1/tasks',(req,res)=>{
    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
        }

        const tasks = JSON.parse(data.toString());
        return res.send(tasks);
    });
});


app.get('/api/v1/tasks/:taskId',(req,res)=>{
    const taskId = Number(req.params.taskId);

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
        }

        const unFilteredData = JSON.parse(data.toString());

        const requestedTask = unFilteredData.tasks.find(t=>t.id===taskId);
        if(!requestedTask){
            return res.status(404).send();
        }

        return res.send(requestedTask);
    });
});

app.put('/api/v1/tasks/:taskId',(req,res)=>{
    const toUpdateTaskId = Number(req.params.taskId);
    const taskToUpdate = req.body;

    if(!taskToUpdate.title || !taskToUpdate.description){
        return res.status(400).send();
    }

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
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
            }
            console.log('Task saved successfully');
        });

        return res.send(unFilteredData);
    });
});

app.delete('/api/v1/tasks/:taskId',(req,res)=>{
    const toDeleteTaskId = Number(req.params.taskId);

    fs.readFile(dbPath,(err,data)=>{
        if(err){
            console.log('Unable to read file');
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
            }
            console.log('Task saved successfully');
        });

        return res.send(unFilteredData);
    });
});

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});



module.exports = app;