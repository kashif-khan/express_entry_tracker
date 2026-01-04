/**
 * Animated statistics component using anime.js
 * Provides smooth count-up animations with reduced-motion support
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { CONFIG, getFeatureFlag } from "@/lib/config";

interface AnimatedStatCardProps {
  title: string;
  value: number;
  format: "number" | "currency" | "percentage";
  subtitle?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export function AnimatedStatCard({
  title,
  value,
  format,
  subtitle,
  icon,
  delay = 0,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const animationsEnabled = getFeatureFlag("FEATURE_STATS_ANIMATIONS") === "on";
  const prefersReducedMotion = useReducedMotion();

  // Format value for display
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
        }).format(val);
      case "percentage":
        return `${Math.round(val)}%`;
      default:
        return Math.round(val).toLocaleString();
    }
  };

  // Animate the counter when element becomes visible
  useEffect(() => {
    if (!elementRef.current || hasAnimated) return;

    const element = elementRef.current;

    const animateCounter = () => {
      if (hasAnimated) return;
      setHasAnimated(true);

      if (!animationsEnabled || prefersReducedMotion) {
        // No animation - set value immediately
        setDisplayValue(value);
        return;
      }

      // Anime.js count-up animation
      const animation = anime({
        targets: { value: 0 },
        value: value,
        duration: CONFIG.ANIMATIONS.COUNT_UP_DURATION,
        delay: delay,
        easing: CONFIG.ANIMATIONS.EASING,
        round: 1,
        update: function (anim) {
          const currentValue = anim.animations[0].currentValue;
          setDisplayValue(Number(currentValue));
        },
      });

      return () => {
        animation.pause();
      };
    };

    // Use Intersection Observer to trigger animation when visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateCounter();
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [value, animationsEnabled, prefersReducedMotion, delay, hasAnimated]);

  return (
    <div
      ref={elementRef}
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 transform transition-transform hover:scale-105"
      data-testid="stat-card"
      aria-label={`${title}: ${formatValue(displayValue, format)}`}
    >
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(displayValue, format)}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

interface StatisticsGridProps {
  statistics: {
    totalDraws: number;
    totalInvitations: number;
    averageCRS: number;
    lowestCRS: number;
    highestCRS: number;
    averageDrawSize: number;
    drawsThisYear: number;
    invitationsThisYear: number;
  };
}

export function StatisticsGrid({ statistics }: StatisticsGridProps) {
  const currentYear = new Date().getFullYear();

  const stats = [
    {
      title: "Total Draws",
      value: statistics.totalDraws,
      format: "number" as const,
      icon: <TrendingUpIcon />,
      delay: 0,
    },
    {
      title: "Total Invitations",
      value: statistics.totalInvitations,
      format: "number" as const,
      icon: <UsersIcon />,
      delay: 100,
    },
    {
      title: "Average CRS Score",
      value: statistics.averageCRS,
      format: "number" as const,
      icon: <TargetIcon />,
      delay: 200,
    },
    {
      title: "Lowest CRS Score",
      value: statistics.lowestCRS,
      format: "number" as const,
      icon: <ArrowDownIcon />,
      delay: 300,
    },
    {
      title: "Average Draw Size",
      value: statistics.averageDrawSize,
      format: "number" as const,
      icon: <ChartBarIcon />,
      delay: 400,
    },
    {
      title: `Draws in ${currentYear}`,
      value: statistics.drawsThisYear,
      format: "number" as const,
      icon: <CalendarIcon />,
      delay: 500,
    },
    {
      title: `Invitations in ${currentYear}`,
      value: statistics.invitationsThisYear,
      format: "number" as const,
      icon: <UserGroupIcon />,
      delay: 600,
    },
    {
      title: "Highest CRS Score",
      value: statistics.highestCRS,
      format: "number" as const,
      icon: <ArrowUpIcon />,
      delay: 700,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <AnimatedStatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          format={stat.format}
          icon={stat.icon}
          delay={stat.delay}
        />
      ))}
    </div>
  );
}

/**
 * Hook to detect if user prefers reduced motion
 */
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

// Simple SVG Icons
function TrendingUpIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function UserGroupIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
