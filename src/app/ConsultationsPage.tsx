import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCms } from "./Layout";
import { Icon, PageHeading } from "./ui";

export interface ConsultationLead {
  id: string;
  name: string;
  phone: string;
  need: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "scheduled" | "completed";
  notes?: string;
}

const LEADS_API_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/consultation_leads";

export function ConsultationsPage() {
  const { notify } = useCms();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ConsultationLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<ConsultationLead | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(LEADS_API_URL, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    let channel: BroadcastChannel | null = null;
    let chatLeadChannel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("aurora-leads-sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "new_lead") {
          notify(`Có đăng ký tư vấn mới từ: ${event.data.lead?.name || "Phụ huynh"}`);
          fetchLeads();
        }
      };

      chatLeadChannel = new BroadcastChannel("aurora_leads_channel");
      chatLeadChannel.onmessage = (event) => {
        if (event.data?.type === "NEW_LEAD") {
          notify(`Có khách bắt đầu Live Chat: ${event.data.lead?.name || "Phụ huynh"} (${event.data.lead?.phone || ""})`);
          fetchLeads();
        }
      };
    } catch {}

    return () => {
      channel?.close();
      chatLeadChannel?.close();
    };
  }, []);

  const saveLeadsToCloud = async (updatedLeads: ConsultationLead[]) => {
    setLeads(updatedLeads);
    try {
      await fetch(LEADS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLeads),
      });
      notify("Đã cập nhật trạng thái đơn tư vấn");
    } catch {
      notify("Lỗi lưu lên máy chủ, vui lòng thử lại");
    }
  };

  const updateStatus = (id: string, status: ConsultationLead["status"]) => {
    const updated = leads.map((item) => (item.id === id ? { ...item, status } : item));
    saveLeadsToCloud(updated);
  };

  const deleteLead = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá đăng ký tư vấn này?")) {
      const updated = leads.filter((item) => item.id !== id);
      saveLeadsToCloud(updated);
      if (selectedLead?.id === id) setSelectedLead(null);
    }
  };

  const exportCsv = () => {
    if (!leads.length) {
      alert("Chưa có danh sách phụ huynh để xuất.");
      return;
    }
    const headers = "Họ tên phụ huynh,Số điện thoại/Zalo,Nhu cầu của con,Ghi chú của phụ huynh,Thời gian gửi,Trạng thái\n";
    const rows = leads
      .map(
        (l) =>
          `"${l.name}","${l.phone}","${l.need || ""}","${(l.message || "").replace(/"/g, '""')}","${formatDate(l.createdAt)}","${statusMeta[l.status]?.label || l.status}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-sach-phu-huynh-tu-van-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    notify("Đã xuất danh sách phụ huynh thành công (file CSV)");
  };

  const updateNotes = (id: string, notes: string) => {
    const updated = leads.map((item) => (item.id === id ? { ...item, notes } : item));
    saveLeadsToCloud(updated);
  };

  const filtered = leads.filter((item) => {
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      (item.need && item.need.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const countNew = leads.filter((l) => l.status === "new").length;
  const countScheduled = leads.filter((l) => l.status === "scheduled").length;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN")}`;
    } catch {
      return iso;
    }
  };

  const statusMeta: Record<ConsultationLead["status"], { label: string; bg: string; color: string; border: string }> = {
    new: { label: "Chờ liên hệ", bg: "var(--color-status-error-bg)", color: "var(--color-status-error)", border: "var(--color-status-error-border)" },
    contacted: { label: "Đã tư vấn", bg: "var(--color-status-info-bg)", color: "var(--color-status-info)", border: "var(--color-status-info-border)" },
    scheduled: { label: "Đã hẹn lịch đánh giá", bg: "var(--color-status-success-bg)", color: "var(--color-status-success)", border: "var(--color-status-success-border)" },
    completed: { label: "Đã nhập học / Hoàn thành", bg: "var(--purple-100)", color: "var(--purple-700)", border: "var(--purple-300)" },
  };

  return (
    <div className="page" style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <PageHeading
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="button button--secondary" onClick={exportCsv} type="button">
              <Icon name="download" size={16} />
              <span>Xuất Excel / CSV</span>
            </button>
            <button className="button button--secondary" onClick={fetchLeads} type="button">
              <Icon name="refresh" size={16} />
              <span>Tải lại</span>
            </button>
          </div>
        }
        description="Theo dõi danh sách phụ huynh để lại số điện thoại đăng ký tư vấn & đánh giá phát triển từ trang web."
        title="Đăng ký tư vấn"
      />

      {/* Quick Stats Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "12px", border: "1px solid #e3dcee" }}>
          <div style={{ fontSize: "14px", color: "#686279" }}>Tổng số lượt đăng ký</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#25213b", marginTop: "4px" }}>{leads.length}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "12px", border: "1px solid #ffccc7" }}>
          <div style={{ fontSize: "14px", color: "#cf1322", fontWeight: "600" }}>Cần gọi tư vấn ngay</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#cf1322", marginTop: "4px" }}>{countNew}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "12px", border: "1px solid #b7eb8f" }}>
          <div style={{ fontSize: "14px", color: "#389e0d", fontWeight: "600" }}>Đã hẹn lịch đánh giá</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#389e0d", marginTop: "4px" }}>{countScheduled}</div>
        </div>
      </div>

      {/* Filters and search */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `Tất cả (${leads.length})` },
            { id: "new", label: `Chờ liên hệ (${countNew})` },
            { id: "contacted", label: "Đã tư vấn" },
            { id: "scheduled", label: `Đã hẹn lịch (${countScheduled})` },
            { id: "completed", label: "Đã hoàn thành" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: filterStatus === tab.id ? "var(--primary)" : "#e3dcee",
                background: filterStatus === tab.id ? "var(--primary)" : "#ffffff",
                color: filterStatus === tab.id ? "#ffffff" : "#565268",
                fontWeight: filterStatus === tab.id ? 600 : 400,
                cursor: "pointer",
                fontSize: "14px",
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên, số Zalo/điện thoại, nhu cầu..."
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #e3dcee",
            background: "#ffffff",
            fontSize: "14px",
            minWidth: "260px",
          }}
          type="search"
          value={searchTerm}
        />
      </div>

      {/* Leads Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#686279" }}>Đang tải dữ liệu đăng ký...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px solid #e3dcee" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#25213b" }}>Chưa có thông tin đăng ký phù hợp</div>
          <p style={{ color: "#686279", marginTop: "6px", fontSize: "14px" }}>
            Khi phụ huynh gửi thông tin trên trang landing page, danh sách sẽ tự động hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e3dcee", overflowX: "auto", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", minWidth: "880px", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", tableLayout: "auto" }}>
            <thead>
              <tr style={{ background: "#fcfaff", borderBottom: "1px solid #e3dcee", color: "#686279", fontWeight: 600 }}>
                <th style={{ padding: "14px 18px", width: "260px", maxWidth: "260px" }}>Phụ huynh</th>
                <th style={{ padding: "14px 18px", width: "140px" }}>Số Zalo / Điện thoại</th>
                <th style={{ padding: "14px 18px", width: "160px" }}>Nhu cầu của con</th>
                <th style={{ padding: "14px 18px", width: "130px" }}>Thời gian gửi</th>
                <th style={{ padding: "14px 18px", width: "140px" }}>Trạng thái</th>
                <th style={{ padding: "14px 18px", width: "150px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const meta = statusMeta[lead.status] || statusMeta.new;
                const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                return (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #f0eaf8", transition: "background 0.2s" }}>
                    <td style={{ padding: "14px 18px", maxWidth: "260px", width: "260px" }}>
                      <div
                        onClick={() => navigate(`/chat-khach-hang?phone=${cleanPhone}`)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                          maxWidth: "240px",
                          userSelect: "none",
                        }}
                        title={`Nhấp để trò chuyện trực tiếp qua Live Chat với ${lead.name}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong
                            style={{
                              color: "#25213b",
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "170px",
                            }}
                            title={lead.name}
                          >
                            {lead.name}
                          </strong>
                          <span
                            style={{
                              fontSize: "10.5px",
                              background: "#f3e8ff",
                              color: "#6b21a8",
                              border: "1px solid #d8b4fe",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            💬 Chat
                          </span>
                        </div>
                        {lead.message && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#686279",
                              fontWeight: 400,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "235px",
                            }}
                            title={lead.message}
                          >
                            "{lead.message}"
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <a
                        href={`tel:${cleanPhone}`}
                        style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        title="Gọi điện ngay"
                      >
                        <Icon name="phone" size={15} />
                        {lead.phone}
                      </a>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#565268" }}>
                      <span style={{ background: "#f3ebff", color: "var(--primary)", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: 500 }}>
                        {lead.need || "Tư vấn chung"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#686279", fontSize: "13px" }}>
                      {formatDate(lead.createdAt)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <select
                        onChange={(e) => updateStatus(lead.id, e.target.value as ConsultationLead["status"])}
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        value={lead.status}
                      >
                        <option value="new">🔴 Chờ liên hệ</option>
                        <option value="contacted">🔵 Đã tư vấn</option>
                        <option value="scheduled">🟢 Đã hẹn lịch</option>
                        <option value="completed">🟣 Hoàn thành</option>
                      </select>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                        <a
                          href={`#/chat-khach-hang?phone=${cleanPhone}`}
                          style={{
                            padding: "6px 10px",
                            background: "linear-gradient(135deg, #7c3aed, #50008b)",
                            color: "#ffffff",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Mở trò chuyện trực tiếp Live Chat"
                        >
                          💬 Chat
                        </a>
                        <a
                          href={`https://zalo.me/${cleanPhone}`}
                          rel="noopener noreferrer"
                          style={{
                            padding: "6px 10px",
                            background: "#0068ff",
                            color: "#ffffff",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                          target="_blank"
                          title="Nhắn tin qua Zalo"
                        >
                          Zalo
                        </a>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#cf1322",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "4px",
                          }}
                          title="Xóa đăng ký"
                          type="button"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
