import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

interface Expense {
  id: number;
  expense_name: string;
  amount: string;
  expense_date: string;
}

export default function ExpenseDetails() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/expenses")
      .then((res) => setExpenses(res.data))
      .catch((err) => {
        showToast(
          "error",
          err.response?.data?.error || "Failed to load expenses",
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = { generatedAt: new Date().toLocaleString("en-IN") };
      const res = await api.get("/expenses/export/pdf", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "expenses.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", "Expenses PDF downloaded.");
    } catch (err: any) {
      showToast("error", "Failed to generate the PDF export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>All Expenses Details</h3>
        <button
          className="btn-export"
          onClick={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? "Generating..." : "⬇ Download PDF"}
        </button>
      </div>

      {loading && <div className="empty-state">Loading expenses...</div>}

      {!loading && expenses.length === 0 && (
        <div className="empty-state">No expenses recorded yet.</div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Expenses Name</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.expense_name}</td>
                  <td>₹{Number(e.amount).toFixed(2)}</td>
                  <td>
                    {new Date(e.expense_date).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
