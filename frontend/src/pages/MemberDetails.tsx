import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

interface Member {
  id: number;
  name: string;
  surname: string;
  phone: string;
  flat_no: string;
  wing: string;
  contribution_date: string;
  amount: string;
  payment_mode: string;
  receipt_no: string;
}

const WINGS = ["All", "A", "B", "C", "Others"];

export default function MemberDetails() {
  const [members, setMembers] = useState<Member[]>([]);
  const [wing, setWing] = useState("All");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMembers = async (selectedWing: string) => {
    setLoading(true);
    try {
      const params = selectedWing !== "All" ? { wing: selectedWing } : {};
      const res = await api.get("/members", { params });
      setMembers(res.data);
    } catch (err: any) {
      showToast("error", err.response?.data?.error || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(wing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wing]);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseOrigin = apiBase.replace(/\/api\/?$/, "");

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = {
        ...(wing !== "All" ? { wing } : {}),
        generatedAt: new Date().toLocaleString("en-IN"),
      };
      const res = await api.get("/members/export/pdf", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `members${wing !== "All" ? `-wing-${wing}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", "Member list PDF downloaded.");
    } catch (err: any) {
      showToast("error", "Failed to generate the PDF export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>All Member Details</h3>
        <button
          className="btn-export"
          onClick={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? "Generating..." : "⬇ Download PDF"}
        </button>
      </div>

      <div className="toolbar">
        {WINGS.map((w) => (
          <button
            key={w}
            className={`filter-chip${wing === w ? " active" : ""}`}
            onClick={() => setWing(w)}
          >
            {w === "All"
              ? "All Wings"
              : w === "Others"
                ? "Others"
                : `Wing ${w}`}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state">Loading members...</div>}

      {!loading && members.length === 0 && (
        <div className="empty-state">No members found for this filter.</div>
      )}

      {!loading && members.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Phone No.</th>
                <th>Flat No.</th>
                <th>Wing</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.surname}</td>
                  <td>{m.phone}</td>
                  <td>{m.flat_no}</td>
                  <td>{m.wing}</td>
                  <td>
                    {new Date(m.contribution_date).toLocaleDateString("en-IN")}
                  </td>
                  <td>₹{Number(m.amount).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${m.payment_mode === "Online" ? "badge-online" : "badge-cash"}`}
                    >
                      {m.payment_mode}
                    </span>
                  </td>
                  <td>
                    {m.receipt_no && (
                      <a
                        className="download-link"
                        href={`${baseOrigin}/api/members/receipt/${m.receipt_no}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View PDF
                      </a>
                    )}
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
