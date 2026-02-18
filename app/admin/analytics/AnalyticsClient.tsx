"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    totalTickets: number;
    monthlyTickets: number;
    ticketsGrowth: number;
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowth: number;
  };
  recentSales: Array<{
    id: string;
    amount: number;
    createdAt: string;
    user: { name: string | null; email: string };
    event: { title: string };
  }>;
  topEvents: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  salesOverTime: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30days");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  // Custom label renderer for PieChart
  const renderPieLabel = (entry: any) => {
    // Get first word of title for label
    return entry.title?.split(' ')[0] || '';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.totalRevenue.toFixed(2)}
              </p>
              <div className="flex items-center mt-2">
                {data.summary.revenueGrowth > 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  data.summary.revenueGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {Math.abs(data.summary.revenueGrowth)}% vs last month
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.monthlyRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tickets Sold Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.totalTickets}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">
                  {data.summary.monthlyTickets} this month
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.activeUsers}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  {data.summary.newUsersThisMonth} new this month
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Over Time Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Over Time</h3>
            <select
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Tickets Sold"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

       {/* Top Events Chart */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Events</h3>
  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.topEvents}
          dataKey="sales"
          nameKey="title"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={renderPieLabel}
        >
          {data.topEvents.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const eventData = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {eventData.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tickets: <span className="font-medium text-gray-900">{eventData.sales}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Revenue: <span className="font-medium text-gray-900">${eventData.revenue.toFixed(2)}</span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
  <div className="mt-4 space-y-2">
    {data.topEvents.map((event, index) => (
      <div key={event.id} className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
          <span className="text-gray-600 truncate max-w-[150px]">{event.title}</span>
        </div>
        <span className="font-medium text-gray-900">{event.sales} tickets</span>
      </div>
    ))}
  </div>
</div>
      </div>

    {/* Recent Sales & Activity */}
<div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
  {/* Recent Sales */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
    <div className="space-y-4">
      {data.recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {sale.user.name || sale.user.email}
            </p>
            <p className="text-xs text-gray-500">{sale.event.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ${sale.amount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(sale.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
      
      {data.recentSales.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No recent transactions</p>
        </div>
                 )}
                </div>
            </div>
        </div>
    </div>
  );
}