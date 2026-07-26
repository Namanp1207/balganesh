import { useState, FormEvent } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const initialForm = {
  name: "",
  surname: "",
  phone: "",
  flat_no: "",
  wing: "A",
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  payment_mode: "Cash",
};

export default function AddMember() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReceiptUrl(null);
    setLoading(true);
    try {
      const res = await api.post("/members", form);
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const baseOrigin = apiBase.replace(/\/api\/?$/, "");
      setReceiptUrl(`${baseOrigin}${res.data.receiptUrl}`);

      showToast("success", "Member added successfully. Receipt PDF generated.");
      setForm(initialForm);
    } catch (err: any) {
      showToast("error", err.response?.data?.error || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginTop: 0 }}>Add Member</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Surname</label>
            <input name="surname" value={form.surname} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone No.</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" required />
          </div>
          <div className="form-group">
            <label>Flat No.</label>
            <input name="flat_no" value={form.flat_no} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Wing</label>
            <select name="wing" value={form.wing} onChange={handleChange}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} min="0" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Payment Mode</label>
            <select name="payment_mode" value={form.payment_mode} onChange={handleChange}>
              <option value="Cash">Cash</option>
              <option value="Online">Online (Google Pay)</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Submitting..." : "Add Member"}
        </button>
      </form>

      {receiptUrl && (
        <div style={{ marginTop: 12 }}>
          <a className="download-link" href={receiptUrl} target="_blank" rel="noreferrer">
            📄 View / Download Receipt PDF
          </a>
        </div>
      )}
    </div>
  );
}
