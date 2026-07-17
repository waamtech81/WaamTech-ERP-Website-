export const securityPage = {
  hero: {
    eyebrow: "Security & Trust",
    title: "Enterprise Security You Can Trust",
    description:
      "Your business data is protected with enterprise-grade security, secure authentication, role-based access control and modern cloud architecture.",
  },
  highlights: [
    {
      title: "Enterprise-Grade Security",
      description: "Built with layered controls that protect your workspace, users, and operational data around the clock.",
      icon: "ShieldCheck",
    },
    {
      title: "Secure User Authentication",
      description: "Strong sign-in flows help ensure only authorized people can access your WAAMTO account.",
      icon: "Lock",
    },
    {
      title: "OTP Verification",
      description: "One-time passcodes add an extra verification step when confirming sensitive account actions.",
      icon: "KeyRound",
    },
    {
      title: "Role-Based Access Control (RBAC)",
      description: "Grant precise permissions by role so teams only see and do what their job requires.",
      icon: "UserCog",
    },
    {
      title: "Secure Session Management",
      description: "Sessions are protected with modern practices to reduce unauthorized or stale access risk.",
      icon: "Fingerprint",
    },
    {
      title: "Multi-Tenant Data Isolation",
      description: "Each business workspace is isolated so your data stays separated from other organizations.",
      icon: "Layers",
    },
    {
      title: "Secure Cloud Infrastructure",
      description: "Runs on modern cloud architecture designed for reliable, secure SaaS delivery.",
      icon: "Cloud",
    },
    {
      title: "Automatic Backups",
      description: "Regular backups help protect continuity so your business can recover with confidence.",
      icon: "HardDrive",
    },
    {
      title: "Activity Logs & Audit Trail",
      description: "Track important actions across your workspace for accountability and operational clarity.",
      icon: "ScrollText",
    },
    {
      title: "License & Subscription Protection",
      description: "Licensing and subscription status are validated to keep access aligned with your plan.",
      icon: "BadgeCheck",
    },
    {
      title: "Automatic Security Updates",
      description: "Platform updates roll out continuously so you benefit from ongoing improvements without downtime drama.",
      icon: "RefreshCw",
    },
    {
      title: "Secure Customer Portal",
      description: "Manage billing, licenses, and account settings through a protected customer portal experience.",
      icon: "Globe",
    },
  ],
  dataProtection: [
    {
      title: "Business data isolation",
      description:
        "Tenant boundaries keep each organization's records separate, so one business cannot access another's information.",
      icon: "Database",
    },
    {
      title: "Secure HTTPS/TLS encryption",
      description:
        "Connections to WAAMTO use encrypted transport so data in transit stays protected between your browsers and our platform.",
      icon: "Lock",
    },
    {
      title: "Protected customer accounts",
      description:
        "Account credentials and access pathways are designed to reduce takeover risk and keep ownership with the right people.",
      icon: "Users",
    },
    {
      title: "Secure login sessions",
      description:
        "Authenticated sessions are managed carefully so active work stays available while unauthorized reuse is limited.",
      icon: "KeyRound",
    },
    {
      title: "Privacy-focused architecture",
      description:
        "We design for least-privilege access and clear data boundaries — privacy is part of the product, not an afterthought.",
      icon: "Eye",
    },
  ],
  reliability: [
    {
      title: "Reliable Cloud Platform",
      description: "A dependable SaaS foundation built for day-to-day business operations.",
      icon: "Cloud",
    },
    {
      title: "Scalable Architecture",
      description: "Grow users, locations, and modules without rebuilding your core systems.",
      icon: "TrendingUp",
    },
    {
      title: "High Availability",
      description: "Architecture choices prioritize uptime so teams can keep working when it matters.",
      icon: "Zap",
    },
    {
      title: "Automatic Updates",
      description: "Improvements and fixes ship continuously so your platform stays current.",
      icon: "RefreshCw",
    },
    {
      title: "Real-Time License Validation",
      description: "Subscription and license status stay in sync with what your organization is entitled to use.",
      icon: "BadgeCheck",
    },
    {
      title: "Modern SaaS Infrastructure",
      description: "A contemporary cloud stack designed for secure multi-tenant enterprise ERP.",
      icon: "Server",
    },
  ],
  faqs: [
    {
      question: "How is my data protected?",
      answer:
        "WAAMTO protects your data with encrypted HTTPS/TLS connections, multi-tenant isolation, role-based permissions, secure sessions, and ongoing platform security updates. Access is limited to authorized users within your business workspace.",
    },
    {
      question: "How are user accounts secured?",
      answer:
        "User accounts are protected through secure authentication, OTP verification for sensitive steps, and role-based access control. Admins can assign permissions so each person only accesses the modules and actions they need.",
    },
    {
      question: "Is data isolated between businesses?",
      answer:
        "Yes. WAAMTO is a multi-tenant platform with business-level data isolation. Each organization's workspace and records are separated so one tenant cannot view or modify another tenant's data.",
    },
    {
      question: "How are sessions protected?",
      answer:
        "Login sessions are managed with modern secure-session practices. This helps keep active users productive while reducing the risk of unauthorized or stale session reuse across devices and browsers.",
    },
    {
      question: "How are subscriptions secured?",
      answer:
        "License and subscription status are validated by the platform, and customers manage plans through a secure customer portal. This keeps product access aligned with your active subscription and entitlements.",
    },
  ],
} as const;
