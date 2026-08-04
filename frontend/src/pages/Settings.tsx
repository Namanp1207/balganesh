import { useEffect, useState, FormEvent } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setWhatsappNumber(res.data.whatsappNotifyNumber || ""))
      .catch((err) => {
        showToast(
          "error",
          err.response?.data?.error || "Failed to load settings",
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/settings", {
        whatsappNotifyNumber: whatsappNumber,
      });
      setWhatsappNumber(res.data.whatsappNotifyNumber || "");
      showToast(
        "success",
        res.data.whatsappNotifyNumber
          ? "Saved. Every new receipt will now be sent to this WhatsApp number."
          : "Saved. Automatic WhatsApp sending is now turned off.",
      );
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.error || "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      <div className="form-group full" style={{ marginBottom: 24 }}>
        <label>WhatsApp Notification Number</label>
        {loading ? (
          <p style={{ color: "var(--text-gray)", fontSize: 13 }}>Loading...</p>
        ) : (
          <form onSubmit={handleSave}>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. +919876543210"
            />
            <p
              style={{
                color: "var(--text-gray)",
                fontSize: 12.5,
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              Every time a member is added, a copy of their donation receipt PDF
              is sent automatically to this WhatsApp number. It is{" "}
              <strong>not</strong> sent to the donor's own phone number — this
              is a single number of your choosing (e.g. the treasurer's phone)
              that receives a copy of every receipt for record-keeping. Leave
              this blank to turn automatic WhatsApp sending off entirely.
            </p>
            <button
              className="btn-primary"
              type="submit"
              disabled={saving}
              style={{ marginTop: 14, width: 200 }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
