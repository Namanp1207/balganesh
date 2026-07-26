import { useState, FormEvent } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const initialForm = {
  expense_name: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function AddExpense() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/expenses", form);
      showToast("success", "Expense added successfully.");
      setForm(initialForm);
    } catch (err: any) {
      showToast("error", err.response?.data?.error || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginTop: 0 }}>Add Expense</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group full">
            <label>Expenses Name</label>
            <input name="expense_name" value={form.expense_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} min="0" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Submitting..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
