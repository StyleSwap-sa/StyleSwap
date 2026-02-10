/**
 * Analytics Export Service
 * Handles exporting API usage data in various formats (CSV, JSON)
 */

export interface ExportEvent {
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: string;
  ipAddress: string;
}

export interface ExportStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: string;
  successRate: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Export events as CSV format
 */
export function exportEventsAsCSV(
  events: ExportEvent[],
  filename?: string
): { csv: string; filename: string } {
  try {
    const headers = [
      "Timestamp",
      "Method",
      "Endpoint",
      "Status Code",
      "Response Time",
      "IP Address",
    ];

    const rows = events.map((event) => [
      event.timestamp,
      event.method,
      event.endpoint,
      event.statusCode.toString(),
      event.responseTime,
      event.ipAddress,
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n") + "\n";

    const defaultFilename = `api-events-${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      csv,
      filename: filename || defaultFilename,
    };
  } catch (error) {
    console.error("[Analytics Export] Error exporting CSV:", error);
    return { csv: "", filename: filename || "events.csv" };
  }
}

/**
 * Export events as JSON format
 */
export function exportEventsAsJSON(
  events: ExportEvent[],
  stats?: ExportStats,
  filename?: string
): { json: string; filename: string } {
  try {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        eventCount: events.length,
        ...(stats && { stats }),
      },
      events,
    };

    const json = JSON.stringify(data, null, 2);
    const defaultFilename = `api-events-${new Date().toISOString().slice(0, 10)}.json`;

    return {
      json,
      filename: filename || defaultFilename,
    };
  } catch (error) {
    console.error("[Analytics Export] Error exporting JSON:", error);
    return { json: "", filename: filename || "events.json" };
  }
}

/**
 * Export statistics as JSON
 */
export function exportStatsAsJSON(
  stats: ExportStats,
  filename?: string
): { json: string; filename: string } {
  try {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
      },
      statistics: stats,
    };

    const json = JSON.stringify(data, null, 2);
    const defaultFilename = `api-stats-${new Date().toISOString().slice(0, 10)}.json`;

    return {
      json,
      filename: filename || defaultFilename,
    };
  } catch (error) {
    console.error("[Analytics Export] Error exporting stats:", error);
    return { json: "", filename: filename || "stats.json" };
  }
}

/**
 * Generate HTML report for analytics
 */
export function generateHTMLReport(
  apiKeyName: string,
  stats: ExportStats,
  events: ExportEvent[]
): { html: string; filename: string } {
  try {
    const successRate = stats.successRate;
    const errorRate = 100 - successRate;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Usage Report - ${apiKeyName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .metadata {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card.success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .stat-card.error {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        }
        .stat-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        tr:hover {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Usage Report</h1>
        <div class="metadata">
            <strong>API Key:</strong> ${apiKeyName}<br>
            <strong>Period:</strong> ${stats.period.start} to ${stats.period.end}<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Requests</div>
                <div class="stat-value">${stats.totalRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card success">
                <div class="stat-label">Successful</div>
                <div class="stat-value">${stats.successfulRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card error">
                <div class="stat-label">Failed</div>
                <div class="stat-value">${stats.failedRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-label">Rate Limited</div>
                <div class="stat-value">${stats.rateLimitedRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Success Rate</div>
                <div class="stat-value">${stats.successRate}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Response Time</div>
                <div class="stat-value">${stats.averageResponseTime}</div>
            </div>
        </div>

        <h2>Recent Events</h2>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>IP Address</th>
                </tr>
            </thead>
            <tbody>
                ${events
                  .slice(0, 50)
                  .map(
                    (event) => `
                <tr>
                    <td>${event.timestamp}</td>
                    <td><strong>${event.method}</strong></td>
                    <td>${event.endpoint}</td>
                    <td>${event.statusCode}</td>
                    <td>${event.responseTime}</td>
                    <td>${event.ipAddress}</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        <div class="footer">
            <p>This report was automatically generated by StyleSwap API Analytics.</p>
            <p>For more information, visit your Developer Portal.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const filename = `api-report-${apiKeyName}-${new Date().toISOString().slice(0, 10)}.html`;

    return { html, filename };
  } catch (error) {
    console.error("[Analytics Export] Error generating HTML report:", error);
    return { html: "", filename: "report.html" };
  }
}
