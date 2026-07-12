"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getAnalyticsStats, AnalyticsStats } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AnalyticsOverview() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalyticsStats()
      .then((res) => {
        setStats(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-gray-100 dark:bg-gray-800 rounded-t-xl" />
            <CardContent className="h-16 bg-gray-50 dark:bg-gray-900 rounded-b-xl" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl bg-lighterror p-6 text-center text-sm text-error">
        <Icon icon="solar:danger-triangle-linear" className="mx-auto mb-2 text-2xl" />
        <p>{error || "No analytics data available"}</p>
      </div>
    );
  }

  // Find top device, location, and ISP
  const getTopKey = (record: Record<string, number>) => {
    const entries = Object.entries(record);
    if (entries.length === 0) return "N/A";
    return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0];
  };

  const topDevice = getTopKey(stats.device_stats);
  const topLocation = getTopKey(stats.location_stats);

  // Line Chart (Views over time)
  const lineChartData = {
    series: [
      {
        name: "Page Views",
        data: stats.views_over_time.map((d) => d.views),
      },
    ],
    options: {
      chart: {
        id: "views-over-time",
        type: "area" as const,
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        foreColor: "#adb0bb",
      },
      colors: ["var(--color-primary, #5d87ff)"],
      stroke: {
        curve: "smooth" as const,
        width: 3,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "rgba(0,0,0,0.1)",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: stats.views_over_time.map((d) => {
          // Format date string (YYYY-MM-DD) to a shorter readable format
          const date = new Date(d.date);
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }),
      },
      tooltip: {
        theme: "dark",
      },
    },
  };

  // Donut Chart (Devices)
  const deviceKeys = Object.keys(stats.device_stats);
  const deviceValues = Object.values(stats.device_stats);
  const donutChartData = {
    series: deviceValues,
    options: {
      chart: {
        type: "donut" as const,
        fontFamily: "inherit",
      },
      labels: deviceKeys,
      colors: ["#5d87ff", "#49beff", "#ffae1f"],
      legend: {
        position: "bottom" as const,
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
          },
        },
      },
      tooltip: {
        theme: "dark",
      },
    },
  };

  // Helper to render horizontal progress bars for stats lists
  const renderProgressBarList = (data: Record<string, number>, colorClass: string) => {
    const entries = Object.entries(data);
    const maxVal = Math.max(...entries.map(([, val]) => val), 1);

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => {
          const percentage = (value / maxVal) * 100;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-darkLink truncate max-w-[70%]" title={key}>
                  {key}
                </span>
                <span className="text-link font-semibold">{value} views</span>
              </div>
              <div className="w-full bg-lightprimary/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h2 className="text-2xl font-bold text-ld">Visitor Analytics</h2>
        <p className="text-sm text-link">Real-time statistics of visitors on your portfolio.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-link">Total Page Views</CardTitle>
            <div className="p-2 bg-lightprimary text-primary rounded-md">
              <Icon icon="solar:eye-linear" className="text-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ld">{stats.total_views}</div>
            <p className="text-xs text-link mt-1">Accumulated page views</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-link">Unique Visitors</CardTitle>
            <div className="p-2 bg-lightsuccess text-success rounded-md">
              <Icon icon="solar:users-group-two-rounded-linear" className="text-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ld">{stats.unique_visitors}</div>
            <p className="text-xs text-link mt-1">Distinct IP addresses tracked</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-link">Top Device</CardTitle>
            <div className="p-2 bg-lightwarning text-warning rounded-md">
              <Icon icon="solar:smartphone-linear" className="text-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ld truncate" title={topDevice}>
              {topDevice}
            </div>
            <p className="text-xs text-link mt-1">Most used device category</p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-link">Top Location</CardTitle>
            <div className="p-2 bg-lighterror text-error rounded-md">
              <Icon icon="solar:map-point-linear" className="text-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ld truncate" title={topLocation}>
              {topLocation}
            </div>
            <p className="text-xs text-link mt-1">Highest traffic origin</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Time-series views chart */}
        <Card className="lg:col-span-2 bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Page Views History</CardTitle>
            <CardDescription>Daily page views over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.views_over_time.length > 0 ? (
              <Chart
                options={lineChartData.options}
                series={lineChartData.series}
                type="area"
                height={300}
                width="100%"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-link">
                No history data available for this week.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices breakdown */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Visitor device categories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
            {deviceValues.length > 0 ? (
              <Chart
                options={donutChartData.options}
                series={donutChartData.series}
                type="donut"
                width="100%"
                height={260}
              />
            ) : (
              <div className="text-sm text-link">No device data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Detailed Stats row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Popular paths */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Popular Pages</CardTitle>
            <CardDescription>Most visited sections of your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.path_stats).length > 0 ? (
              renderProgressBarList(stats.path_stats, "bg-primary")
            ) : (
              <p className="text-sm text-link py-6 text-center">No page data tracked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Traffic Locations</CardTitle>
            <CardDescription>Where your visitors view from</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.location_stats).length > 0 ? (
              renderProgressBarList(stats.location_stats, "bg-success")
            ) : (
              <p className="text-sm text-link py-6 text-center">No location data tracked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top ISPs / Networks */}
        <Card className="bg-white dark:bg-darkgray md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Internet Providers (ISP)</CardTitle>
            <CardDescription>Visitor internet network providers</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.isp_stats).length > 0 ? (
              renderProgressBarList(stats.isp_stats, "bg-warning")
            ) : (
              <p className="text-sm text-link py-6 text-center">No ISP data tracked yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Browser and Referrer Stats row */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Referrers */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Traffic Referrers</CardTitle>
            <CardDescription>Source channels directing visitors to your site</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.referrer_stats).length > 0 ? (
              renderProgressBarList(stats.referrer_stats, "bg-indigo-500")
            ) : (
              <p className="text-sm text-link py-6 text-center">No referrer data tracked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card className="bg-white dark:bg-darkgray">
          <CardHeader>
            <CardTitle>Browsers & OS</CardTitle>
            <CardDescription>Web browsers used by your visitors</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.browser_stats).length > 0 ? (
              renderProgressBarList(stats.browser_stats, "bg-rose-500")
            ) : (
              <p className="text-sm text-link py-6 text-center">No browser data tracked yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
