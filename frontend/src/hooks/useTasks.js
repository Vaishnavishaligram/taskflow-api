import { useState, useCallback } from 'react';
import { tasksAPI } from '../services/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await tasksAPI.getStats();
      setStats(data.data);
    } catch (_) {}
  }, []);

  const createTask = async (taskData) => {
    const { data } = await tasksAPI.create(taskData);
    setTasks((prev) => [data.data, ...prev]);
    return data;
  };

  const updateTask = async (id, taskData) => {
    const { data } = await tasksAPI.update(id, taskData);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.data : t)));
    return data;
  };

  const deleteTask = async (id) => {
    await tasksAPI.delete(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return { tasks, stats, loading, error, meta, fetchTasks, fetchStats, createTask, updateTask, deleteTask };
};
