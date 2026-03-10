import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import {
  MessageSquare,
  Code2,
  Shield,
  LayoutDashboard,
  Globe,
  Database,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Zap
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language Chat-to-Data",
    description: "Ask questions in plain English like 'Why was churn high last month?' or 'Show me top 5 campaigns' and get instant answers.",
    highlights: [
      "Central chat interface for all queries",
      "Rich responses with tables & summaries",
      "AI auto-selects best visualization type",
      "Supports complex analytical questions"
    ],
    visual: (
      <div className="flex items-center justify-center gap-4 py-6">
        <LineChart className="w-10 h-10 text-primary/60 animate-bounce-subtle" />
        <BarChart3 className="w-14 h-14 text-primary" />
        <PieChart className="w-10 h-10 text-primary/60 animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
      </div>
    )
  },
  {
    icon: Code2,
    title: "Cursor-like SQL Editor",
    description: "A professional split-screen view with chat on the left and raw SQL on the right. Edit AI-generated queries before execution.",
    highlights: [
      "Syntax highlighting with Monaco Editor",
      "Edit SQL before running",
      "Real-time query validation",
      "Full control for technical users"
    ],
    visual: (
      <div className="font-mono text-xs bg-secondary/50 rounded-lg p-4 text-muted-foreground border border-border">
        <span className="text-primary">SELECT</span> * <span className="text-primary">FROM</span> users<br />
        <span className="text-primary">WHERE</span> status = <span className="text-accent">'active'</span><br />
        <span className="text-primary">ORDER BY</span> created_at <span className="text-primary">DESC</span>
      </div>
    )
  },
  {
    icon: Shield,
    title: "Transaction Sandbox",
    description: "UPDATE and DELETE queries never run immediately. Every change goes through a dry-run with an impact preview before execution.",
    highlights: [
      "Automatic dry-run in transactions",
      "Impact preview showing affected rows",
      "One-click Commit or Rollback",
      "Full audit trail of changes"
    ],
    visual: (
      <div className="flex items-center gap-3 text-sm">
        <div className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          15 rows affected
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
        <div className="px-4 py-2 rounded-lg bg-success/10 text-success border border-success/20 font-medium">
          Review & Commit
        </div>
      </div>
    )
  },
  {
    icon: LayoutDashboard,
    title: "Instant Dashboard Generation",
    description: "Ask 'Build me a marketing dashboard' and get a persistent view with multiple charts arranged in a professional grid layout.",
    highlights: [
      "Auto-generated metric dashboards",
      "CAC, LTV, Daily Traffic charts",
      "Customizable grid layouts",
      "Save & share dashboards"
    ],
    visual: (
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 rounded-lg bg-gradient-primary opacity-60"></div>
        <div className="h-10 rounded-lg bg-primary/30"></div>
        <div className="h-10 rounded-lg bg-primary/20"></div>
        <div className="h-10 rounded-lg bg-primary/20 col-span-2"></div>
        <div className="h-10 rounded-lg bg-gradient-primary opacity-40"></div>
      </div>
    )
  },
  {
    icon: Globe,
    title: "External Intelligence Layer",
    description: "When analyzing metrics, the AI cross-references external news and events to provide context for anomalies.",
    highlights: [
      "Web search integration",
      "Market event correlation",
      "Competitor launch detection",
      "Contextual insights"
    ],
    visual: (
      <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50 border border-border">
        <TrendingUp className="w-5 h-5 text-destructive" />
        <span>Sales dropped 10% — Competitor launched new product</span>
      </div>
    )
  },
  {
    icon: Database,
    title: "Data Source Management",
    description: "A dedicated Connections page to easily add, configure, and manage database credentials for multiple data sources.",
    highlights: [
      "PostgreSQL, MySQL, Supabase",
      "Secure credential storage",
      "Connection health monitoring",
      "Multi-database queries"
    ],
    visual: (
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Mail,
    title: "Weekly Analytics Health Report",
    description: "Automated email reports showcasing weekly analytics highlights including anomalies, growth trends, and key metrics.",
    highlights: [
      "Automated weekly emails",
      "Anomaly detection alerts",
      "Growth trend analysis",
      "Customizable report sections"
    ],
    visual: (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
        <Mail className="w-8 h-8 text-primary" />
        <div className="text-sm">
          <div className="font-medium text-foreground">Weekly Report Ready</div>
          <div className="text-muted-foreground">3 anomalies • 12% growth</div>
        </div>
      </div>
    )
  },
];

export default function Features() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4 pl-2 border-l border-border/50">
                <div className="hidden lg:flex flex-col items-end leading-tight">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Account</span>
                  <span className="text-sm font-bold text-foreground">{user.username}</span>
                </div>
                <Link to="/dashboard">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-9">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/signup">
                  <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                    Sign Up
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                    Launch App
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28 relative">
        <div className="absolute inset-0 bg-gradient-radial opacity-40" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Complete Feature Overview
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Everything You Need to
              <br />
              <span className="text-gradient-primary">Master Your Data</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Kuantra combines natural language querying with a professional SQL editor,
              giving both business users and technical teams the power to work with data safely and efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* Features List */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="space-y-24 md:space-y-32">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">{feature.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, j) => (
                      <li key={j} className="flex items-center gap-3 text-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className="flex-1 w-full max-w-lg">
                  <div className="feature-card p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-primary/60"></div>
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                    </div>
                    {feature.visual}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-radial opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-8 animate-glow-pulse">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your
              <span className="text-gradient-primary"> Data Workflow?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join data teams who are saving hours every week with Kuantra.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="h-14 px-10 text-lg bg-gradient-primary hover:opacity-90 glow-primary">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-primary/30 hover:bg-primary/5">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 Kuantra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
