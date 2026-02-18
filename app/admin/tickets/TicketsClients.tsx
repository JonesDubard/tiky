"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  Ticket,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MoreVertical
} from "lucide-react";

interface Ticket {
  id: string;
  status: string;
  qrCode: string;
  guestName: string | null;
  guestEmail: string | null;
  phoneNumber: string | null;
  validatedAt: string | null;
  createdAt: string;
  ticketType: {
    id: string;
    name: string;
    price: number;
    event: {
      id: string;
      title: string;
      date: string;
    };
  };
  order: {
    id: string;
    status: string;
    totalPrice: number;
    user: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  } | null;
}

const statusColors: Record<string, string> = {
  RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  USED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, any> = {
  RESERVED: Clock,
  PAID: CheckCircle,
  USED: CheckCircle,
  CANCELLED: XCircle,
  EXPIRED: XCircle,
};

export default function TicketsClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets");
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      // Create CSV
      const csvContent = [
        ["Ticket ID", "Event", "Customer", "Email", "Status", "Purchase Date", "Price"],
        ...data.map((ticket: any) => [
          ticket['Ticket ID'],
          ticket['Event'],
          ticket['Customer'],
          ticket['Email'],
          ticket['Status'],
          ticket['Purchase Date'],
          ticket['Price'],
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (error) {
      console.error("Error exporting tickets:", error);
    } finally {
      setExporting(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.order?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.order?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.guestName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || ticket.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Ticket ID, Customer name or email..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="RESERVED">Reserved</option>
              <option value="PAID">Paid</option>
              <option value="USED">Used</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTickets.map((ticket) => {
              const StatusIcon = statusIcons[ticket.status] || Ticket;
              
              return (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Ticket className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-mono text-gray-900">
                        {ticket.id.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.ticketType.event.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(ticket.ticketType.event.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.order?.user?.name || ticket.guestName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {ticket.order?.user?.email || ticket.guestEmail || 'N/A'}
                    </div>
                    {ticket.phoneNumber && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {ticket.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      statusColors[ticket.status] || "bg-gray-100 text-gray-800"
                    }`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${ticket.ticketType.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredTickets.length}</span> of{" "}
          <span className="font-medium">{tickets.length}</span> tickets
        </p>
      </div>
    </div>
  );
}