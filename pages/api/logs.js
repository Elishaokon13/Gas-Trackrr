// Create a simple in-memory log storage
// In a real app, you might use a more persistent solution
let logs = [];
const MAX_LOGS = 500; // Limit log storage to prevent memory issues

// Expose our logging function to be used throughout the app
export const serverLog = (type, message, data = null) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    type: type.toUpperCase(),
    message,
    data: data ? JSON.stringify(data) : null
  };
  
  // Add to logs with limit
  logs.push(log);
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  
  // Also log to console
  console.log(`[${timestamp}] [${log.type}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [${log.type}] DATA:`, 
      typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : data);
  }
  
  return log;
};

// API route handler
export default function handler(req, res) {
  // For security in a real app, you might want to add authentication
  
  // Add a test log entry if requested
  if (req.query.test === 'true') {
    serverLog('test', 'This is a test log entry', { time: new Date().toISOString() });
  }
  
  // Clear logs if requested
  if (req.query.clear === 'true') {
    logs = [];
    serverLog('system', 'Logs cleared');
  }
  
  // Filter logs if type is specified
  let filteredLogs = logs;
  if (req.query.type) {
    const type = req.query.type.toUpperCase();
    filteredLogs = logs.filter(log => log.type === type);
  }
  
  // Filter logs by search term if specified
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(search) || 
      (log.data && log.data.toLowerCase().includes(search))
    );
  }
  
  // Get only most recent logs if limit is specified
  if (req.query.limit) {
    const limit = parseInt(req.query.limit, 10);
    if (!isNaN(limit) && limit > 0) {
      filteredLogs = filteredLogs.slice(-limit);
    }
  }
  
  // Return the logs
  res.status(200).json({
    logs: filteredLogs,
    total: logs.length,
    filtered: filteredLogs.length,
    timestamp: new Date().toISOString()
  });
} 