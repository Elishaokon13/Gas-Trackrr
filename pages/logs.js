import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: '',
    search: '',
    limit: 100
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.search) params.append('search', filter.search);
      if (filter.limit) params.append('limit', filter.limit);
      
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      
      setLogs(data.logs);
      setTotal(data.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      await fetch('/api/logs?clear=true');
      fetchLogs();
    }
  };

  const handleGenerateTestLog = async () => {
    await fetch('/api/logs?test=true');
    fetchLogs();
  };

  // Get unique log types for filter dropdown
  const logTypes = [...new Set(logs.map(log => log.type))];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Base Wrapped Logs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Base Wrapped Logs</h1>
          <div className="space-x-2">
            <button
              onClick={handleGenerateTestLog}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Test Log
            </button>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Clear Logs
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Log Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {logTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Search in logs..."
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Limit</label>
            <select
              value={filter.limit}
              onChange={(e) => setFilter({ ...filter, limit: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="50">Last 50</option>
              <option value="100">Last 100</option>
              <option value="200">Last 200</option>
              <option value="500">Last 500</option>
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-gray-400">
              Showing {logs.length} of {total} logs
            </span>
          </div>
        </div>

        {loading && <p className="text-center py-4">Loading logs...</p>}
        
        {error && (
          <div className="bg-red-900 border border-red-700 rounded p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-400">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-700">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {log.message}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400 max-w-md truncate">
                        {log.data ? (
                          <span className="cursor-pointer hover:text-blue-400" title="Click to view full data" onClick={() => alert(log.data)}>
                            {log.data.length > 100 ? log.data.substring(0, 100) + '...' : log.data}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-500">
          <p>
            Gas expense tracking logs for Base Wrapped
          </p>
        </div>
      </main>
    </div>
  );
}

// Helper function to get color based on log type
function getTypeColor(type) {
  switch (type.toLowerCase()) {
    case 'error':
      return 'bg-red-900 text-red-200';
    case 'warning':
      return 'bg-yellow-900 text-yellow-200';
    case 'gas':
      return 'bg-green-900 text-green-200';
    case 'info':
      return 'bg-blue-900 text-blue-200';
    case 'zerion':
      return 'bg-purple-900 text-purple-200';
    case 'csv':
      return 'bg-pink-900 text-pink-200';
    default:
      return 'bg-gray-700 text-gray-200';
  }
} 