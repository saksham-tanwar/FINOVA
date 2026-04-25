import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const tabs = ["Mutual Funds", "Stocks", "Fixed Deposits"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const fdRateMap = {
  1: 6.5,
  2: 6.8,
  3: 7.0,
  5: 7.2,
  7: 7.5,
};

function Investments() {
  const [activeTab, setActiveTab] = useState("Mutual Funds");
  const [funds, setFunds] = useState([]);
  const [portfolio, setPortfolio] = useState({
    byType: { mutual_fund: [], stock: [], fd: [] },
    totalInvested: 0,
    currentValue: 0,
    pnl: 0,
  });
  const [fundModal, setFundModal] = useState({ open: false, fund: null });
  const [fundForm, setFundForm] = useState({
    amount: "",
    sipActive: false,
    sipAmount: "",
    sipDay: "",
  });
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [stockPriceMap, setStockPriceMap] = useState({});
  const [stockUnits, setStockUnits] = useState({});
  const [fdForm, setFdForm] = useState({ amount: "", tenure: "1" });
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    try {
      const { data } = await axiosInstance.get("/investments/portfolio");
      setPortfolio(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const loadFunds = async () => {
    try {
      const { data } = await axiosInstance.get("/investments/mutual-funds");
      setFunds(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load mutual funds");
    }
  };

  useEffect(() => {
    loadFunds();
    loadPortfolio();
  }, []);

  const openFundModal = (fund) => {
    setFundModal({ open: true, fund });
    setFundForm({
      amount: "",
      sipActive: false,
      sipAmount: fund.minSIP,
      sipDay: "5",
    });
  };

  const closeFundModal = () => {
    setFundModal({ open: false, fund: null });
  };

  const handleFundInvest = async () => {
    try {
      await axiosInstance.post("/investments/mutual-funds/invest", {
        fundId: fundModal.fund.id,
        amount: Number(fundForm.amount),
        sipActive: fundForm.sipActive,
        sipAmount: fundForm.sipActive ? Number(fundForm.sipAmount) : undefined,
        sipDay: fundForm.sipActive ? Number(fundForm.sipDay) : undefined,
      });
      toast.success("Mutual fund investment created");
      closeFundModal();
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to invest in fund");
    }
  };

  const handleRedeemFund = async (id) => {
    try {
      await axiosInstance.post(`/investments/mutual-funds/${id}/redeem`);
      toast.success("Mutual fund redeemed");
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to redeem fund");
    }
  };

  const handleSearchStocks = async () => {
    try {
      const { data } = await axiosInstance.get("/investments/stocks/search", {
        params: { q: stockQuery },
      });
      setStockResults(data);

      const nextPrices = {};
      await Promise.all(
        data.map(async (stock) => {
          const priceRes = await axiosInstance.get(
            `/investments/stocks/${encodeURIComponent(stock.symbol)}/price`
          );
          nextPrices[stock.symbol] = priceRes.data.price;
        })
      );
      setStockPriceMap(nextPrices);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to search stocks");
    }
  };

  const handleBuyStock = async (symbol) => {
    try {
      await axiosInstance.post("/investments/stocks/buy", {
        symbol,
        units: Number(stockUnits[symbol]),
      });
      toast.success("Stock purchased");
      setStockUnits((prev) => ({ ...prev, [symbol]: "" }));
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to buy stock");
    }
  };

  const handleSellStock = async (id) => {
    try {
      const { data } = await axiosInstance.post(`/investments/stocks/${id}/sell`);
      toast.success(`Stock sold. PnL: ${formatCurrency(data.pnl)}`);
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to sell stock");
    }
  };

  const handleCreateFd = async (event) => {
    event.preventDefault();

    try {
      await axiosInstance.post("/investments/fd", {
        amount: Number(fdForm.amount),
        tenure: Number(fdForm.tenure),
      });
      toast.success("FD created");
      setFdForm({ amount: "", tenure: "1" });
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create FD");
    }
  };

  const handleBreakFd = async (id) => {
    try {
      await axiosInstance.post(`/investments/fd/${id}/break`);
      toast.success("FD broken successfully");
      loadPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to break FD");
    }
  };

  const chartData = useMemo(
    () =>
      portfolio.byType.stock.map((holding, index) => ({
        name: holding.instrumentName.replace(".BSE", ""),
        value: Number(((holding.units || 0) * (holding.currentPrice || 0)).toFixed(2)),
        order: index + 1,
      })),
    [portfolio]
  );

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === tab ? "bg-cyan-500 text-slate-950" : "text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Mutual Funds" ? (
        <div className="space-y-6">
          {loading ? <SkeletonCardGrid cards={3} /> : null}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {funds.map((fund) => (
              <div
                key={fund.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{fund.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{fund.category}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                    {fund.oneYearReturn}% 1Y
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    {fund.riskLevel} risk
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    NAV {formatCurrency(fund.nav)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openFundModal(fund)}
                  className="mt-6 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
                >
                  Invest
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">My Mutual Funds</h3>
            <div className="mt-4 space-y-3">
              {portfolio.byType.mutual_fund.map((investment) => (
                <div
                  key={investment._id}
                  className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{investment.instrumentName}</p>
                    <p className="text-sm text-slate-400">
                      Units {investment.units} - Invested {formatCurrency(investment.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">
                      Current NAV {formatCurrency(investment.currentPrice)}
                    </span>
                    {investment.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => handleRedeemFund(investment._id)}
                        className="rounded-md border border-emerald-500/30 px-3 py-2 text-sm text-emerald-300"
                      >
                        Redeem
                      </button>
                    ) : (
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        {investment.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {portfolio.byType.mutual_fund.length === 0 ? (
                <EmptyState
                  icon="MF"
                  title="No mutual funds yet"
                  description="Start with a fund card above and build your investment base."
                  actionLabel="Browse investment plans"
                  actionTo="/dashboard/investments"
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Stocks" ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                value={stockQuery}
                onChange={(event) => setStockQuery(event.target.value)}
                placeholder="Search stocks by symbol or company"
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />
              <button
                type="button"
                onClick={handleSearchStocks}
                className="rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
              >
                Search
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {stockResults.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{stock.symbol}</p>
                    <p className="text-sm text-slate-400">{stock.name}</p>
                    <p className="mt-1 text-sm text-cyan-300">
                      {formatCurrency(stockPriceMap[stock.symbol])}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={stockUnits[stock.symbol] || ""}
                      onChange={(event) =>
                        setStockUnits((prev) => ({
                          ...prev,
                          [stock.symbol]: event.target.value,
                        }))
                      }
                      placeholder="Units"
                      className="w-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleBuyStock(stock.symbol)}
                      className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold text-white">My Holdings</h3>
              <div className="mt-4 space-y-3">
                {portfolio.byType.stock.map((holding) => (
                  <div
                    key={holding._id}
                    className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{holding.instrumentName}</p>
                      <p className="text-sm text-slate-400">
                        {holding.units} units - Avg {formatCurrency(holding.purchasePrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-300">
                        {formatCurrency((holding.units || 0) * (holding.currentPrice || 0))}
                      </span>
                      {holding.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleSellStock(holding._id)}
                          className="rounded-md border border-amber-500/30 px-3 py-2 text-sm text-amber-300"
                        >
                          Sell
                        </button>
                      ) : (
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                          {holding.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {portfolio.byType.stock.length === 0 ? (
                  <EmptyState
                    icon="ST"
                    title="No stock holdings yet"
                    description="Search for a symbol above to place your first simulated stock order."
                  />
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Portfolio Value</h3>
                <span
                  className={`text-sm ${
                    portfolio.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(portfolio.pnl)} PnL
                </span>
              </div>
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {portfolio.byType.stock.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon="[]"
                    title="Portfolio chart will appear here"
                    description="Once you hold stocks, this chart will track the value of your simulated positions."
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Fixed Deposits" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold text-white">FD Rates</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(fdRateMap).map(([tenure, rate]) => (
                  <div
                    key={tenure}
                    className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    <span>{tenure} Year</span>
                    <span>{rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleCreateFd}
              className="rounded-lg border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-xl font-semibold text-white">Create Fixed Deposit</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  min="1000"
                  step="0.01"
                  value={fdForm.amount}
                  onChange={(event) =>
                    setFdForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="Amount"
                  className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                />
                <select
                  value={fdForm.tenure}
                  onChange={(event) =>
                    setFdForm((prev) => ({ ...prev, tenure: event.target.value }))
                  }
                  className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                >
                  {Object.keys(fdRateMap).map((tenure) => (
                    <option key={tenure} value={tenure}>
                      {tenure} years
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="mt-4 rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
              >
                Create FD
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">My FDs</h3>
            <div className="mt-4 space-y-3">
              {portfolio.byType.fd.map((fd) => {
                const daysLeft = Math.max(
                  0,
                  Math.ceil(
                    (new Date(fd.maturityDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                );

                return (
                  <div
                    key={fd._id}
                    className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{fd.instrumentName}</p>
                      <p className="text-sm text-slate-400">
                        Principal {formatCurrency(fd.amount)} - Maturity{" "}
                        {formatCurrency(fd.currentPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-cyan-500/30 px-3 py-1 text-xs text-cyan-300">
                        {daysLeft} days left
                      </span>
                      {fd.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleBreakFd(fd._id)}
                          className="rounded-md border border-amber-500/30 px-3 py-2 text-sm text-amber-300"
                        >
                          Break FD
                        </button>
                      ) : (
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                          {fd.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {portfolio.byType.fd.length === 0 ? (
                <EmptyState
                  icon="FD"
                  title="No fixed deposits yet"
                  description="Create a fixed deposit to lock in a tenure and projected maturity value."
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {fundModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">
              Invest in {fundModal.fund.name}
            </h3>
            <div className="mt-4 space-y-4">
              <input
                type="number"
                min={fundModal.fund.minSIP}
                step="0.01"
                value={fundForm.amount}
                onChange={(event) =>
                  setFundForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="Investment amount"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={fundForm.sipActive}
                  onChange={(event) =>
                    setFundForm((prev) => ({
                      ...prev,
                      sipActive: event.target.checked,
                    }))
                  }
                />
                Enable SIP
              </label>
              {fundForm.sipActive ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    min={fundModal.fund.minSIP}
                    step="1"
                    value={fundForm.sipAmount}
                    onChange={(event) =>
                      setFundForm((prev) => ({
                        ...prev,
                        sipAmount: event.target.value,
                      }))
                    }
                    placeholder="SIP amount"
                    className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={fundForm.sipDay}
                    onChange={(event) =>
                      setFundForm((prev) => ({
                        ...prev,
                        sipDay: event.target.value,
                      }))
                    }
                    placeholder="SIP day"
                    className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFundModal}
                className="rounded-md border border-slate-700 px-4 py-2 text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFundInvest}
                className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950"
              >
                Confirm Investment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Investments;
