import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { getUser } from "@/lib/auth";
import { NeuralNetwork } from "@/components/graphics/NeuralNetwork";
import { CircuitBoard } from "@/components/graphics/CircuitBoard";
import { DataFlow } from "@/components/graphics/DataFlow";
import logoImage from "@/assets/logo.png";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Brain,
  Database,
  BarChart3,
  Lock,
  Terminal,
  Layers,
  MessageSquare,
  Code2,
  Globe
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language Queries",
    description: "Ask questions in plain English. Our AI translates intent into optimized SQL.",
    color: "from-red-500 to-orange-500"
  },
  {
    icon: Code2,
    title: "Cursor-like SQL Editor",
    description: "Split-screen with AI chat and raw SQL. Edit with syntax highlighting.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Transaction Sandbox",
    description: "Every UPDATE/DELETE runs in dry-run first. Review before committing.",
    color: "from-red-600 to-rose-500"
  },
  {
    icon: Layers,
    title: "Instant Dashboards",
    description: "Request a dashboard and get auto-generated charts instantly.",
    color: "from-rose-500 to-red-500"
  },
  {
    icon: Globe,
    title: "External Intelligence",
    description: "AI cross-references news to explain metric anomalies.",
    color: "from-red-500 to-red-600"
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption.",
    color: "from-red-600 to-orange-600"
  },
];

const stats = [
  { value: "10x", label: "Faster Insights" },
  { value: "99.9%", label: "Uptime" },
  { value: "500+", label: "Companies" },
  { value: "<1s", label: "Query Time" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 opacity-20"
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 0.2, rotate: 0 }}
          transition={{ duration: 2 }}
        >
          <CircuitBoard className="w-full h-full" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 opacity-15"
          initial={{ opacity: 0, rotate: 10 }}
          animate={{ opacity: 0.15, rotate: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          <CircuitBoard className="w-full h-full" />
        </motion.div>
      </div>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <motion.img
              src={logoImage}
              alt="Kuantra"
              className="h-9 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <span className="font-bold text-xl hidden sm:block">Kuantra</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
              Demo
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          </nav>

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
                <Link to="/signin">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                      Launch App
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero - Asymmetric Layout */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left content */}
            <motion.div
              className="lg:col-span-7 relative z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Brain className="w-4 h-4" />
                AI-Powered Business Intelligence
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Your Data,{" "}
                <span className="relative">
                  <span className="text-gradient-primary">Understood</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 h-1 bg-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 0.8 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Kuantra transforms how teams interact with data. Query databases in natural language.
                Edit SQL with AI assistance. All with built-in safety guardrails.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link to="/signup">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="w-full sm:w-auto gap-2 h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 border-border hover:bg-muted">
                    <Terminal className="w-4 h-4 mr-2" />
                    View Demo
                  </Button>
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                className="flex items-center gap-6 mt-10 pt-10 border-t border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background" />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-foreground font-medium">500+</span>
                  <span className="text-muted-foreground"> data teams trust us</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Hero Visual */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-radial scale-150" />

              {/* Brain logo large */}
              <motion.div
                className="relative z-10 flex justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <motion.img
                    src={logoImage}
                    alt="Kuantra AI"
                    className="w-64 md:w-80 lg:w-96 h-auto drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 60px hsl(var(--primary) / 0.4))" }}
                  />

                  {/* Orbiting elements */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary glow-primary" />
                  </motion.div>
                  <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/70" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Neural network decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-30">
                <NeuralNetwork className="w-full h-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative py-12 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for Modern Data Teams
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to explore, analyze, and safely modify your data—all through conversation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className={`group relative p-6 md:p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_50px_hsl(var(--primary)/0.1)] ${i === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.color}`} style={{ opacity: 0.03 }} />

                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/features">
              <Button variant="outline" className="gap-2">
                Explore All Features
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section className="py-24 md:py-32 bg-muted/10 border-y border-border/50 relative overflow-hidden">
        {/* Data flow background */}
        <div className="absolute inset-0 opacity-10">
          <DataFlow className="w-full h-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From question to insight in seconds
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Your Database",
                desc: "Securely link PostgreSQL, MySQL, or Supabase in under a minute.",
                icon: Database
              },
              {
                step: "02",
                title: "Ask in Plain English",
                desc: "Type natural questions or switch to SQL mode for precise control.",
                icon: MessageSquare
              },
              {
                step: "03",
                title: "Get Instant Insights",
                desc: "Receive answers with auto-generated visualizations and safe modification workflows.",
                icon: BarChart3
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-6 md:gap-10 mb-12 last:mb-0"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
                    {item.step}
                  </div>
                  {i < 2 && <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent mt-4" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            className="relative max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-radial" />

            <motion.img
              src={logoImage}
              alt=""
              className="h-32 md:h-40 w-auto mx-auto mb-8 relative z-10 object-contain"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 relative z-10">
              Ready to Transform Your<br />
              <span className="text-gradient-primary">Data Workflow?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto relative z-10">
              Join hundreds of data teams who save hours every week with Kuantra.
            </p>

            <motion.div className="relative z-10" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/signup">
                <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Kuantra" className="h-8 w-auto" />
              <span className="font-semibold">Kuantra</span>
            </div>

            <nav className="flex items-center gap-8">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </Link>
            </nav>

            <p className="text-sm text-muted-foreground">
              © 2024 Kuantra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
