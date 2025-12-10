'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare, CheckCircle2, XCircle, Clock, Bell, ChevronDown, Send } from "lucide-react";

type SupportMessage = {
  id: string;
  ticketId: string;
  senderType: 'user' | 'admin';
  senderId: string;
  message: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
};

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

  function playBellSound() {
    try {
      // Use HTML5 Audio for better browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Bell-like sound: two tones with better timing
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error('Failed to play bell sound:', error);
      // Fallback: try using HTML5 audio beep
      try {
        const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTgwOUKnm8LZjGwY4kdfyznksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU4MDlCp5vC2YxsGOJHX8s55LAUkd8fw3ZBACxRe');
        beep.volume = 0.5;
        beep.play().catch(() => {});
      } catch (e) {
        console.error('Fallback audio also failed:', e);
      }
    }
  }

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    // Poll for new messages every 30 seconds (without showing loading)
    const interval = setInterval(() => {
      pollTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  async function loadTickets() {
    try {
      setLoading(true);
      const data = await api.admin.getAllSupportTickets();
      let filteredTickets = data as SupportTicket[];
      
      if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
      }
      
      setTickets(filteredTickets);
    } catch (error) {
      console.error('Failed to load support tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function pollTickets() {
    try {
      // Poll without showing loading state
      const data = await api.admin.getAllSupportTickets();
      let filteredTickets = data as SupportTicket[];
      
      if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
      }
      
      // Check for new user messages and play bell sound
      setTickets((oldTickets) => {
        filteredTickets.forEach((newTicket) => {
          const oldTicket = oldTickets.find(t => t.id === newTicket.id);
          const oldMessageCount = oldTicket?.messages?.length || 0;
          const newMessageCount = newTicket.messages?.length || 0;
          
          // Check if user sent a new message
          if (newTicket.messages && newMessageCount > oldMessageCount) {
            const newUserMessages = newTicket.messages.filter(m => 
              m.senderType === 'user' && 
              (!oldTicket?.messages || !oldTicket.messages.find(om => om.id === m.id))
            );
            if (newUserMessages.length > 0) {
              playBellSound();
            }
          }
        });
        return filteredTickets;
      });
    } catch (error) {
      console.error('Failed to poll tickets:', error);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      setProcessing(id);
      await api.admin.updateSupportTicket(id, status);
      await loadTickets();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update ticket');
    } finally {
      setProcessing(null);
    }
  }

  function getStatusColor(status: string) {
    const statusMap: Record<string, { label: string; className: string }> = {
      'Open': { label: 'Open', className: 'bg-blue-500/20 text-blue-400' },
      'In Progress': { label: 'In Progress', className: 'bg-yellow-500/20 text-yellow-400' },
      'Resolved': { label: 'Resolved', className: 'bg-emerald-500/20 text-emerald-400' },
      'Closed': { label: 'Closed', className: 'bg-gray-500/20 text-gray-400' },
    };
    return statusMap[status] || statusMap['Open'];
  }

  function getCategoryColor(category: string) {
    const categoryMap: Record<string, string> = {
      'Deposit': 'bg-emerald-500/20 text-emerald-400',
      'Withdrawal': 'bg-rose-500/20 text-rose-400',
      'IPO': 'bg-blue-500/20 text-blue-400',
      'Trading': 'bg-purple-500/20 text-purple-400',
      'KYC': 'bg-yellow-500/20 text-yellow-400',
      'Other': 'bg-gray-500/20 text-gray-400',
    };
    return categoryMap[category] || categoryMap['Other'];
  }

  if (loading) {
    return (
      <AdminShell title="Support Tickets" subtitle="Manage user support requests">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Support Tickets" subtitle="Manage user support requests">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/60">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-slate-900">All</option>
            <option value="Open" className="bg-slate-900">Open</option>
            <option value="In Progress" className="bg-slate-900">In Progress</option>
            <option value="Resolved" className="bg-slate-900">Resolved</option>
            <option value="Closed" className="bg-slate-900">Closed</option>
          </select>
        </div>

        {/* Tickets List with Chat Interface */}
        {tickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center text-white/60">
            <MessageSquare className="size-12 mx-auto mb-4 opacity-50" />
            <p>No support tickets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const isExpanded = expandedTickets.has(ticket.id);
              const hasNewUserMessage = ticket.messages?.some(m => 
                m.senderType === 'user' && 
                new Date(m.createdAt) > new Date(Date.now() - 30000) // Within last 30 seconds
              );
              const hasUserMessages = ticket.messages?.some(m => m.senderType === 'user') || !!ticket.message;
              
              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedTickets);
                      if (isExpanded) {
                        newExpanded.delete(ticket.id);
                      } else {
                        newExpanded.add(ticket.id);
                      }
                      setExpandedTickets(newExpanded);
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="font-mono text-xs text-white/60">{ticket.id}</code>
                          {hasNewUserMessage && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400 animate-pulse">
                              <Bell className="size-3" />
                              New Message
                            </span>
                          )}
                          {hasUserMessages && !hasNewUserMessage && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                              <MessageSquare className="size-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-white/50">{ticket.userName}</p>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", getCategoryColor(ticket.category))}>
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", getStatusColor(ticket.status).className)}>
                          {getStatusColor(ticket.status).label}
                        </span>
                        <ChevronDown className={cn("size-4 text-white/40 transition-transform", isExpanded && "rotate-180")} />
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4">
                      {/* Chat Messages */}
                      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                        {/* Initial user message */}
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-2xl bg-blue-500/20 border border-blue-500/30 p-3">
                            <p className="text-xs text-white/60 mb-1">{ticket.userName}</p>
                            <p className="text-sm text-white whitespace-pre-wrap">{ticket.message}</p>
                            <p className="text-xs text-white/50 mt-1">
                              {new Date(ticket.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        {/* Chat messages */}
                        {ticket.messages && ticket.messages.length > 0 ? (
                          ticket.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                msg.senderType === 'user' ? "justify-start" : "justify-end"
                              )}
                            >
                              <div className={cn(
                                "max-w-[80%] rounded-2xl p-3",
                                msg.senderType === 'user'
                                  ? "bg-blue-500/20 border border-blue-500/30"
                                  : "bg-emerald-500/20 border border-emerald-500/30"
                              )}>
                                <p className="text-xs text-white/60 mb-1">
                                  {msg.senderType === 'admin' ? 'You' : ticket.userName}
                                </p>
                                <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs text-white/50 mt-1">
                                  {new Date(msg.createdAt).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fallback to adminResponse if messages array doesn't exist
                          ticket.adminResponse && (
                            <div className="flex justify-end">
                              <div className="max-w-[80%] rounded-2xl bg-emerald-500/20 border border-emerald-500/30 p-3">
                                <p className="text-xs text-white/60 mb-1">You</p>
                                <p className="text-sm text-white whitespace-pre-wrap">{ticket.adminResponse}</p>
                                <p className="text-xs text-white/50 mt-1">
                                  {new Date(ticket.updatedAt).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Reply Form */}
                      {ticket.status !== 'Closed' && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const replyMessage = replyMessages[ticket.id] || '';
                            
                            if (!replyMessage.trim()) return;

                            try {
                              setProcessing(ticket.id);
                              await api.admin.updateSupportTicket(ticket.id, ticket.status, replyMessage);
                              setReplyMessages({ ...replyMessages, [ticket.id]: '' });
                              await loadTickets();
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Failed to send message');
                            } finally {
                              setProcessing(null);
                            }
                          }}
                          className="flex gap-2 border-t border-white/10 pt-4"
                        >
                          <textarea
                            value={replyMessages[ticket.id] || ''}
                            onChange={(e) => setReplyMessages({ ...replyMessages, [ticket.id]: e.target.value })}
                            placeholder="Type your reply..."
                            rows={2}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-blue-500 resize-none"
                          />
                          <button
                            type="submit"
                            disabled={processing === ticket.id || !replyMessages[ticket.id]?.trim()}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {processing === ticket.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            Send
                          </button>
                        </form>
                      )}

                      {/* Status Actions */}
                      <div className="flex items-center gap-3 flex-wrap mt-4 pt-4 border-t border-white/10">
                        {ticket.status !== 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                            disabled={processing === ticket.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition disabled:opacity-50"
                          >
                            <Clock className="size-3" />
                            In Progress
                          </button>
                        )}
                        {ticket.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                            disabled={processing === ticket.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="size-3" />
                            Resolved
                          </button>
                        )}
                        {ticket.status !== 'Closed' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'Closed')}
                            disabled={processing === ticket.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-500/30 bg-gray-500/10 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-500/20 transition disabled:opacity-50"
                          >
                            <XCircle className="size-3" />
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
