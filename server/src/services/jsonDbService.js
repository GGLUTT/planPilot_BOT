const fs = require('fs').promises;
const path = require('path');

const usersPath = path.join(__dirname, '../../data/users.json');
const tasksPath = path.join(__dirname, '../../data/tasks.json');

// Допоміжні функції
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Якщо файл не існує, створюємо його з пустим масивом
      await fs.writeFile(filePath, '[]', 'utf8');
      return [];
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Користувачі
const getUsers = async () => readJsonFile(usersPath);
const getUserById = async (id) => {
  const users = await getUsers();
  return users.find(user => user.id === id);
};
const getUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find(user => user.email === email);
};
const createUser = async (userData) => {
  const users = await getUsers();
  const newUser = { id: Date.now().toString(), ...userData };
  users.push(newUser);
  await writeJsonFile(usersPath, users);
  return newUser;
};
const updateUser = async (id, userData) => {
  let users = await getUsers();
  users = users.map(user => user.id === id ? { ...user, ...userData } : user);
  await writeJsonFile(usersPath, users);
  return users.find(user => user.id === id);
};
const deleteUser = async (id) => {
  let users = await getUsers();
  users = users.filter(user => user.id !== id);
  await writeJsonFile(usersPath, users);
};

// Завдання
const getTasks = async () => readJsonFile(tasksPath);
const getTaskById = async (id) => {
  const tasks = await getTasks();
  return tasks.find(task => task.id === id);
};
const getTasksByUserId = async (userId) => {
  const tasks = await getTasks();
  return tasks.filter(task => task.userId === userId);
};
const createTask = async (taskData) => {
  const tasks = await getTasks();
  const newTask = { id: Date.now().toString(), ...taskData };
  tasks.push(newTask);
  await writeJsonFile(tasksPath, tasks);
  return newTask;
};
const updateTask = async (id, taskData) => {
  let tasks = await getTasks();
  tasks = tasks.map(task => task.id === id ? { ...task, ...taskData } : task);
  await writeJsonFile(tasksPath, tasks);
  return tasks.find(task => task.id === id);
};
const deleteTask = async (id) => {
  let tasks = await getTasks();
  tasks = tasks.filter(task => task.id !== id);
  await writeJsonFile(tasksPath, tasks);
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getTasks,
  getTaskById,
  getTasksByUserId,
  createTask,
  updateTask,
  deleteTask
}; 