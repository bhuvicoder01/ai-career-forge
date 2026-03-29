import { CheckCircle, Clock, FileText, LayoutDashboard } from "lucide-react";

export default function ApplicationTracker() {
  const apps = [
    { title: "Senior AI Engineer", company: "DataCorp", status: "Interview", date: "Oct 25, 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Manage your agent-generated materials and view timelines.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
        {apps.map((app, i) => (
          <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/10 transition-colors">
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{app.title}</h3>
                <p className="text-muted-foreground">{app.company} • Applied on {app.date}</p>
                
                <div className="flex items-center gap-2 mt-3 text-sm font-medium">
                  <span className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {app.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
               <button className="w-full sm:w-auto px-4 py-2 border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center">
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  View Tailored Resume
               </button>
               <button className="w-full sm:w-auto px-4 py-2 border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-400" />
                  Interview Prep Kit
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
