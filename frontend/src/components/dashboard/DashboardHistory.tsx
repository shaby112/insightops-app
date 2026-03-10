import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, Trash2, LayoutDashboard, Plus, Save } from "lucide-react";
import type { DashboardConfig } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { getDashboards, deleteDashboard, saveDashboard } from "@/lib/dashboard";

interface DashboardHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDashboard: (config: DashboardConfig) => void;
  currentDashboard: DashboardConfig;
}

const STORAGE_KEY = "kuantra-saved-dashboards";

export function DashboardHistory({
  open,
  onOpenChange,
  onSelectDashboard,
  currentDashboard
}: DashboardHistoryProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [savedDashboards, setSavedDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved dashboards from API
  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const dashboards = await getDashboards();
      setSavedDashboards(dashboards);
    } catch (e) {
      console.error("Failed to fetch dashboards", e);
      toast({ title: "Error", description: "Failed to load dashboards", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDashboards();
    }
  }, [open]);

  const handleSaveCurrent = async () => {
    try {
      await saveDashboard(currentDashboard);
      toast({ title: "Dashboard saved", description: `"${currentDashboard.title}" has been saved` });
      fetchDashboards();
    } catch (e) {
      console.error("Failed to save dashboard", e);
      toast({ title: "Error", description: "Failed to save dashboard", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDashboard(id);
      toast({ title: "Dashboard deleted" });
      fetchDashboards();
    } catch (e) {
      console.error("Failed to delete dashboard", e);
      toast({ title: "Error", description: "Failed to delete dashboard", variant: "destructive" });
    }
  };

  const filteredDashboards = savedDashboards.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            My Dashboards
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSaveCurrent} className="gap-2">
            <Save className="w-4 h-4" />
            Save Current
          </Button>
        </div>

        <div className="flex-1 overflow-auto mt-4 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">No saved dashboards</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create a dashboard and save it to access it later.
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                <Plus className="w-4 h-4" />
                Create New Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredDashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-xl border border-border bg-card",
                    "hover:border-primary/40 hover:bg-card/80",
                    "transition-all duration-200"
                  )}
                >
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => onSelectDashboard(dashboard)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <LayoutDashboard className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {dashboard.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{dashboard.widgets.length} widgets</span>
                        <span>•</span>
                        <span>Updated {formatDistanceToNow(new Date(dashboard.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dashboard.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
