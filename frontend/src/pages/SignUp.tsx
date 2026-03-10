import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, BarChart3, Shield, Sparkles, Zap, Database, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signUp, verifyEmail } from "@/lib/auth";

const benefits = [
  { icon: Zap, text: "Query in plain English" },
  { icon: Shield, text: "Safe transaction sandbox" },
  { icon: BarChart3, text: "Instant visualizations" },
  { icon: Database, text: "Multi-database support" },
];

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpFromServer, setOtpFromServer] = useState<string | null>(null);
  const [phase, setPhase] = useState<"signup" | "verify">("signup");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (phase === "signup") {
        // Backend expects `username` (we're using the "Full Name" field as username for now)
        const username = name.trim();
        const res = await signUp({ username, email, password });
        setOtpFromServer(res.otp_code || null);
        setPhase("verify");
        toast({
          title: "OTP Sent",
          description: "Use the OTP to verify your email (returned in response for testing).",
        });
      } else {
        const code = otp.trim() || otpFromServer || "";
        await verifyEmail({ email, otp_code: code });
        toast({
          title: "Email Verified",
          description: "You're verified. You can now sign in.",
        });
        navigate("/signin");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Floating Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Start querying your databases with AI in minutes.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {phase === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="johndoe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
                      required
                      minLength={8}
                      maxLength={72}
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-foreground">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
                    minLength={6}
                    maxLength={6}
                    required={!otpFromServer}
                  />
                  {otpFromServer && (
                    <p className="text-xs text-muted-foreground">
                      Testing mode: OTP from server is <span className="font-mono">{otpFromServer}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 glow-primary-subtle transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : phase === "signup" ? (
                "Create Account"
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-card to-background border-l border-border relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-radial opacity-40" />
        <div className="absolute inset-0 dot-pattern opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6 animate-glow-pulse">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your data, <span className="text-gradient-primary">your way</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Join thousands of teams who've transformed their data workflow with Kuantra.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{benefit.text}</span>
                <CheckCircle className="w-5 h-5 text-primary/60" />
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 rounded-2xl bg-card/50 border border-border backdrop-blur-sm"
          >
            <p className="text-foreground italic mb-4">
              "Kuantra cut our reporting time from hours to minutes. The natural language interface
              means our entire team can access insights, not just analysts."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                S
              </div>
              <div>
                <div className="font-medium text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">Head of Analytics, TechCorp</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
