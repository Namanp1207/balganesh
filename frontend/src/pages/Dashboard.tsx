import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

interface RecentItem {
  id: number;
  type: "member" | "expense";
  name?: string;
  surname?: string;
  expense_name?: string;
  amount: string;
  created_at: string;
  payment_mode?: string;
  wing?: string;
}

interface DashboardData {
  totalMembers: number;
  totalAmount: number;
  totalExpenses: number;
  balance: number;
  recentlyAdded: RecentItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => {
        showToast(
          "error",
          err.response?.data?.error || "Failed to load dashboard data",
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = Math.abs(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}₹${formatted}`;
  };

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{data?.totalMembers ?? "—"}</div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-icon">👥</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">
              {data ? formatCurrency(data.totalAmount) : "—"}
            </div>
            <div className="stat-label">Total Amount</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">
              {data ? formatCurrency(data.totalExpenses) : "—"}
            </div>
            <div className="stat-label">Total Expenses Amount</div>
          </div>
          <div className="stat-icon">🧾</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">
              {data ? formatCurrency(data.balance) : "—"}
            </div>
            <div className="stat-label">Balance</div>
          </div>
          <div className="stat-icon">⚖️</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Recently Added</h3>
        </div>

        {data && data.recentlyAdded.length === 0 && (
          <div className="empty-state">No records added yet.</div>
        )}

        {data && data.recentlyAdded.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Details</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentlyAdded.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>
                      <span
                        className={`badge ${item.type === "member" ? "badge-success" : "badge-pending"}`}
                      >
                        {item.type === "member" ? "Member" : "Expense"}
                      </span>
                    </td>
                    <td>
                      {item.type === "member"
                        ? `${item.name} ${item.surname}`
                        : item.expense_name}
                    </td>
                    <td>₹{Number(item.amount).toFixed(2)}</td>
                    <td>
                      {item.type === "member" ? (
                        <span
                          className={`badge ${item.payment_mode === "Online" ? "badge-online" : "badge-cash"}`}
                        >
                          Wing {item.wing} · {item.payment_mode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {new Date(item.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
