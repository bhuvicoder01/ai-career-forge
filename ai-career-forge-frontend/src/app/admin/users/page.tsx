"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, Shield, User as UserIcon, MoreVertical, Search, Mail, Key } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role?role=${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black uppercase tracking-tighter">Identity Directory</h1>
           <p className="text-muted-foreground font-medium">Global oversight of all entities within the ZENITH ecosystem.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Search by Email or Alias..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full bg-secondary/50 border border-border rounded-[20px] pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm transition-all"
           />
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-secondary/20 rounded-[24px] animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl relative">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Entity Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Level</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System UUID</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocols</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-lg ${
                              user.role === 'ADMIN' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 
                              user.role === 'RECRUITER' ? 'bg-foreground text-background' : 
                              'bg-secondary text-foreground'
                            }`}>
                               {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div>
                               <p className="text-sm font-black uppercase">{user.name || "Anonymous Operative"}</p>
                               <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 pt-0.5">
                                  <Mail className="w-3 h-3" /> {user.email}
                               </p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            {user.role === 'ADMIN' ? <Shield className="w-4 h-4 text-blue-500" /> : <UserIcon className="w-4 h-4 text-muted-foreground" />}
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${
                              user.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              user.role === 'RECRUITER' ? 'bg-foreground text-background border-transparent' :
                              'bg-secondary text-foreground border-border'
                            }`}>
                              {user.role}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <code className="text-[10px] font-black bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground">
                            {user.id}
                         </code>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <select 
                              value={user.role}
                              onChange={(e) => updateRole(user.id, e.target.value)}
                              className="bg-background border border-border rounded-xl text-[10px] font-black uppercase px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                               <option value="USER">Standard User</option>
                               <option value="RECRUITER">Recruiter</option>
                               <option value="ADMIN">Root Admin</option>
                            </select>
                            <button className="p-3 rounded-xl bg-background border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all text-muted-foreground">
                               <Key className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}
