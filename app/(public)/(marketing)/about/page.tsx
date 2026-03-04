// app/(public)/(marketing)/about/page.tsx
import Link from "next/link";
import { Users, Heart, Target, Zap, Shield, Globe } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Community",
    desc: "Community description goes here.",
  },
  {
    icon: Target,
    title: "Reliability",
    desc: "Your events deserve a platform you can count on, every time.",
  },
  {
    icon: Globe,
    title: "Local First",
    desc: "Designed for Liberia, with local payment methods and support.",
  },
  {
    icon: Zap,
    title: "Innovation",
    desc: "Innovation description goes here.",
  },
  {
    icon: Shield,
    title: "Trust",
    desc: "Trust statement goes here.",
  },
  {
    icon: Heart,
    title: "Passion",
    desc: "Passion description goes here.",
  },
];

const team = [
  {
    name: "Team Member One",
    role: "Co-Founder & CEO",
    bio: "Short bio about this person goes here.",
    initials: "TM",
  },
  {
    name: "Team Member Two",
    role: "Co-Founder & CTO",
    bio: "Short bio about this person goes here.",
    initials: "TM",
  },
  {
    name: "Team Member Three",
    role: "Head of Design",
    bio: "Short bio about this person goes here.",
    initials: "TM",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-16 sm:py-24 md:py-32 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-16 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        <div className="section-container relative text-white text-center">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight text-balance">
            About <span className="text-white/80">Tiky</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed">
            Empowering Liberian events with seamless ticketing, real-time polls,
            and tools that bring people together.
          </p>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 80L48 69.3C96 58.7 192 37.3 288 32C384 26.7 480 37.3 576 48C672 58.7 768 69.3 864 69.3C960 69.3 1056 58.7 1152 48C1248 37.3 1344 26.7 1392 21.3L1440 16V80H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="section-container py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* Mission */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="w-11 h-11 bg-brand-subtle/50 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-brand-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Our <span className="text-gradient">Mission</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              To provide a reliable, all-in-one platform that simplifies event
              management, ticketing, and audience engagement for organizers
              across Liberia.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-primary flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> Community First
              </span>
              <span className="badge badge-accent flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Fast &amp; Simple
              </span>
              <span className="badge badge-primary flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Secure Payments
              </span>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl shadow-sm p-6 sm:p-8 text-white hover-lift">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Our Vision</h3>
            <p className="text-white/85 leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam quidem eius nobis doloremque, sint temporibus dolorem possimus mollitia molestiae impedit.
            </p>
          </div>

        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              What <span className="text-gradient">Drives Us</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              The principles that guide every decision we make at Tiky.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {values.map((v, i) => (
              <div
                key={i}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:border-brand-subtle/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-brand-subtle/40 group-hover:bg-brand-subtle/70 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <v.icon className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      {/*
      <section className="section-container py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Meet the <span className="text-gradient">Team</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            A dedicated group of developers, designers, and event enthusiasts
            working to bring you the best platform.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {team.map((member, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center mb-4 shadow-md">
                <span className="text-white text-xl font-bold">{member.initials}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-0.5">{member.name}</h3>
              <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-3">{member.role}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
      */}

      {/* ── CTA ── */}
      <section className="section-container py-14 sm:py-20">
        <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl sm:rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center text-white overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-balance">
              Ready to create your next event?
            </h2>
            <p className="text-white/85 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Join other organizers who trust Tiky for seamless ticketing and
              audience engagement.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 hover:shadow-xl active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}