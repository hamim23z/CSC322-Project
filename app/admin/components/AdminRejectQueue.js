import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle, TextField } from "@mui/material";

const AdminRejectQueue = () => {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchQueue = async () => {
    const res = await fetch("/api/admin/reject-queue", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    setQueue(data || []);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (userId, timestamp, action) => {
    const res = await fetch("/api/admin/reject-queue/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ userId, timestamp, action }),
    });

    if (res.ok) {
      alert(`✅ ${action.toUpperCase()}ED`);
      fetchQueue();
    } else {
      alert("❌ Failed to update.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">🧾 LLM Reject Queue</h2>

      {queue.length === 0 && <p>No pending rejections.</p>}

      {queue.map((user) =>
        user.queue.map((item, idx) => (
          <div key={`${user._id}-${idx}`} className="mb-4 border p-3 rounded">
            <p><strong>👤 User:</strong> {user.username}</p>
            <p><strong>📝 Original:</strong> {item.original}</p>
            <p><strong>✅ Corrected:</strong> {item.corrected}</p>
            <p><strong>❓ Reason:</strong> {item.reason}</p>
            <p><strong>🕒 Submitted:</strong> {new Date(item.timestamp).toLocaleString()}</p>
            <div className="flex gap-4 mt-2">
              <Button variant="contained" color="success" onClick={() => handleAction(user._id, item.timestamp, "accept")}>
                Accept (1 Token)
              </Button>
              <Button variant="contained" color="error" onClick={() => handleAction(user._id, item.timestamp, "reject")}>
                Reject (5 Tokens)
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminRejectQueue;
