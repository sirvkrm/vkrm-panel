import { useState, useEffect } from 'react';
import type { ProgrammableMetric } from '../data/servicesData';
import {
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Play,
  Cpu,
  Sliders
} from 'lucide-react';

interface ProgrammableStatsViewProps {
  metrics: ProgrammableMetric[];
  onAddMetric: (metric: ProgrammableMetric) => void;
  onRemoveMetric: (metricId: string) => void;
  onNavigateToVariables?: () => void;
  onNavigateToServices?: () => void;
}

export const ProgrammableStatsView = ({
  metrics,
  onAddMetric,
  onRemoveMetric,
  onNavigateToVariables,
  onNavigateToServices,
}: ProgrammableStatsViewProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);

  // New Metric Form State
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricCategory, setNewMetricCategory] = useState('Throughput');
  const [newMetricFormula, setNewMetricFormula] = useState('rate(http_requests_total[1m])');
  const [newMetricUnit, setNewMetricUnit] = useState('req/sec');
  const [newMetricChartType, setNewMetricChartType] = useState<'area' | 'bar' | 'gauge'>('area');
  const [newMetricWarning, setNewMetricWarning] = useState<number>(80);
  const [newMetricCritical, setNewMetricCritical] = useState<number>(150);
  const [testedValue, setTestedValue] = useState<string | null>(null);

  // Live pulse simulation every 2.5s to give life to telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleTestFormula = () => {
    let result = (Math.random() * 45 + 10).toFixed(1);
    if (newMetricUnit === '%') {
      result = (95 + Math.random() * 4.9).toFixed(1);
    } else if (newMetricUnit === 'ms') {
      result = (1.2 + Math.random() * 1.5).toFixed(1);
    }
    setTestedValue(`${result} ${newMetricUnit}`);
  };

  const handleCreateMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim() || !newMetricFormula.trim()) return;

    const baseVal = testedValue ? parseFloat(testedValue) : 32.5;
    const sampleData = Array.from({ length: 10 }, () =>
      Math.max(1, Math.round(baseVal + (Math.random() * 8 - 4)))
    );

    const created: ProgrammableMetric = {
      id: `met_${Date.now()}`,
      name: newMetricName.trim(),
      category: newMetricCategory,
      value: String(baseVal),
      numericValue: baseVal,
      unit: newMetricUnit.trim() || 'val',
      trend: '+4.8%',
      trendDirection: 'up',
      timeframe: 'live 5m',
      formula: newMetricFormula.trim(),
      chartType: newMetricChartType,
      chartData: sampleData,
      thresholdWarning: newMetricWarning || undefined,
      thresholdCritical: newMetricCritical || undefined,
    };

    onAddMetric(created);
    setIsAddModalOpen(false);
    // Reset Form
    setNewMetricName('');
    setNewMetricFormula('rate(http_requests_total[1m])');
    setTestedValue(null);
  };

  // Render SVG Area Chart
  const renderAreaChart = (data: number[]) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 280;
    const height = 65;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 14) - 7;
      return `${x},${y}`;
    });

    const d = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
    const lineD = `M ${points.join(' L ')}`;

    return (
      <div className="relative w-full h-18 overflow-hidden rounded-xl bg-gradient-to-b from-[#0066FF]/5 to-transparent p-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={d} fill="url(#areaGrad)" />
          <path d={lineD} fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].split(',')[0]}
              cy={points[points.length - 1].split(',')[1]}
              r="4"
              fill="#0066FF"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>
    );
  };

  // Render SVG Bar Chart
  const renderBarChart = (data: number[]) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end justify-between gap-1.5 h-18 pt-2 px-1">
        {data.map((val, i) => {
          const heightPct = Math.max(15, (val / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full bg-[#0066FF]/20 group-hover:bg-[#0066FF] rounded-t-md transition-all duration-300"
              />
              <span className="text-[9px] text-[#94A3B8] font-mono opacity-0 group-hover:opacity-100 transition absolute -top-5">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Circular Gauge
  const renderGauge = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
      <div className="flex items-center justify-center h-18">
        <div className="relative size-16">
          <svg className="size-full -rotate-90" viewBox="0 0 76 76">
            <circle
              cx="38"
              cy="38"
              r={radius}
              stroke="#EAEEF4"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="38"
              cy="38"
              r={radius}
              stroke="#10B981"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xs text-[#111827]">
            {clamped}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Telemetry Header */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-extrabold flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#10B981] animate-ping" />
              Live Telemetry Pulse #{pulseTick}
            </span>
            <span className="text-xs text-[#94A3B8]">Streaming from Tokio Runtime</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-2">
            Global Programmable Stats & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Write custom PromQL/Tokio formulas to monitor real-time throughput, mail ingest flow, P95 latencies, and challenge pass rates across all cluster nodes.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigateToServices && (
            <button
              type="button"
              onClick={onNavigateToServices}
              className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Cpu className="size-4 text-[#0066FF]" />
              <span>Services Mesh</span>
            </button>
          )}

          {onNavigateToVariables && (
            <button
              type="button"
              onClick={onNavigateToVariables}
              className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Sliders className="size-4 text-[#0066FF]" />
              <span>API Variables</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Plus className="size-4" />
            <span>Add Custom Metric</span>
          </button>
        </div>
      </div>

      {/* Grid of Programmable Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.map((metric) => {
          const isWarning =
            metric.thresholdWarning !== undefined && metric.numericValue >= metric.thresholdWarning;
          const isCritical =
            metric.thresholdCritical !== undefined && metric.numericValue >= metric.thresholdCritical;

          return (
            <div
              key={metric.id}
              className="bg-white rounded-[26px] p-6 border border-[#EAEEF4] shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                      {metric.category}
                    </span>
                    <h3 className="text-base font-extrabold text-[#111827] mt-0.5 leading-snug">
                      {metric.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveMetric(metric.id)}
                    title="Remove Metric"
                    className="p-1.5 text-[#CBD5E1] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Primary Metric Number & Trend */}
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-[#111827] tracking-tight">
                    {metric.value}
                  </span>
                  <span className="text-xs font-bold text-[#64748B]">{metric.unit}</span>

                  <div className="ml-auto flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-[#ECFDF5] text-[#10B981]">
                    {metric.trendDirection === 'up' ? (
                      <TrendingUp className="size-3.5" />
                    ) : metric.trendDirection === 'down' ? (
                      <TrendingDown className="size-3.5" />
                    ) : (
                      <Minus className="size-3.5" />
                    )}
                    <span>{metric.trend}</span>
                  </div>
                </div>

                {/* Chart Visualization */}
                <div className="mt-4 pt-2">
                  {metric.chartType === 'area' && renderAreaChart(metric.chartData)}
                  {metric.chartType === 'bar' && renderBarChart(metric.chartData)}
                  {metric.chartType === 'gauge' && renderGauge(metric.numericValue)}
                </div>
              </div>

              {/* Bottom Formula & Threshold Badge */}
              <div className="mt-5 pt-3 border-t border-[#F1F5F9] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8] font-medium">{metric.timeframe}</span>
                  {isCritical ? (
                    <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      Critical
                    </span>
                  ) : isWarning ? (
                    <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      Warning
                    </span>
                  ) : (
                    <span className="font-extrabold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Normal
                    </span>
                  )}
                </div>

                <div className="bg-[#F8FAFC] px-2.5 py-1.5 rounded-xl border border-[#EAEEF4] font-mono text-[10px] text-[#475569] truncate">
                  <span className="text-[#0066FF] font-bold">fx: </span>
                  {metric.formula}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Metric Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-[#EAEEF4] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">Define Programmable Metric</h3>
                  <p className="text-xs text-[#64748B]">Add a live telemetry rule with formula and chart</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 rounded-xl bg-[#F3F5F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMetric} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Metric Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMTP Rejection Velocity"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Category</label>
                  <select
                    value={newMetricCategory}
                    onChange={(e) => setNewMetricCategory(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2.5 text-xs text-[#111827] focus:bg-white focus:border-[#0066FF] focus:outline-none cursor-pointer"
                  >
                    <option value="Throughput">Throughput</option>
                    <option value="Ingest">Ingest</option>
                    <option value="Capacity">Capacity</option>
                    <option value="Performance">Performance</option>
                    <option value="Security">Security</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. req/s, %, ms, MB"
                    value={newMetricUnit}
                    onChange={(e) => setNewMetricUnit(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Chart Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">Chart Visualization</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'area', label: 'Area Sparkline', icon: Activity },
                    { id: 'bar', label: 'Bar Velocity', icon: BarChart2 },
                    { id: 'gauge', label: 'Circular Gauge', icon: PieChart },
                  ].map((ct) => {
                    const Icon = ct.icon;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setNewMetricChartType(ct.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          newMetricChartType === ct.id
                            ? 'bg-[#EEF4FF] border-[#0066FF] text-[#0066FF]'
                            : 'bg-[#F8FAFC] border-[#EAEEF4] text-[#64748B] hover:bg-white'
                        }`}
                      >
                        <Icon className="size-4" />
                        <span className="text-[11px]">{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formula Input & Live Evaluator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#111827]">PromQL / Rust Metric Formula</label>
                  <button
                    type="button"
                    onClick={handleTestFormula}
                    className="text-[11px] font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="size-3" />
                    <span>Test Formula</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. rate(smtp_inbound_messages_total[1m])"
                  value={newMetricFormula}
                  onChange={(e) => setNewMetricFormula(e.target.value)}
                  className="w-full bg-[#0F172A] text-[#38BDF8] font-mono border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#0066FF]"
                />

                {testedValue && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/20 flex items-center justify-between text-xs">
                    <span className="text-[#10B981] font-bold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Formula Evaluated Successfully:
                    </span>
                    <span className="font-mono font-extrabold text-[#111827]">{testedValue}</span>
                  </div>
                )}
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Warning Threshold</label>
                  <input
                    type="number"
                    value={newMetricWarning}
                    onChange={(e) => setNewMetricWarning(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Critical Threshold</label>
                  <input
                    type="number"
                    value={newMetricCritical}
                    onChange={(e) => setNewMetricCritical(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAEEF4] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Save & Stream Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
