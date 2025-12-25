const mongoose = require('mongoose');
const { Assignment } = require('./server/models/assignment');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';

async function debugSchema() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const assignments = await Assignment.find({}).sort({ createdAt: -1 }).limit(5);

        for (const assignment of assignments) {
            console.log(`\nAssignment: ${assignment.title} (${assignment._id})`);
            const schema = assignment.gradingSchema;

            if (!schema) {
                console.log('  No gradingSchema found');
                continue;
            }

            console.log('  gradingSchema type:', typeof schema);

            let tasks = [];
            if (typeof schema === 'string') {
                console.log('  gradingSchema is STRING. Content start:', schema.substring(0, 50));
                try {
                    const parsed = JSON.parse(schema);
                    tasks = parsed.tasks || parsed.Tasks || [];
                } catch (e) {
                    console.log('  Failed to parse schema string');
                }
            } else {
                tasks = schema.tasks || schema.Tasks || [];
            }

            console.log('  Tasks found:', tasks.length);

            function printTasks(taskList, indent = '    ') {
                taskList.forEach(t => {
                    const id = t.sub_task_id || t.task_id || t.id;
                    console.log(`${indent}Task ID: "${id}" (Type: ${typeof id}), Max: ${t.marks || t.max_marks}`);
                    if (t.sub_tasks && t.sub_tasks.length > 0) {
                        printTasks(t.sub_tasks, indent + '  ');
                    }
                });
            }

            printTasks(tasks);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugSchema();
