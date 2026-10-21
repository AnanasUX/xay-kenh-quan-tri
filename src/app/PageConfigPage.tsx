import { useEffect, useMemo, useState } from "react";
import { AiAssistantModal } from "./AiAssistantModal";
import { initialLandingPageConfig, type LandingPageConfig, type LandingSection, type LandingSectionId } from "./landingPage";
import { useCms } from "./Layout";
import { Icon, PageHeading } from "./ui";

export const STORAGE_KEY = "aurora-cms:landing-page";
export const CLOUD_API_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/landing_config";

function loadLandingPageConfig(): LandingPageConfig {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as LandingPageConfig) : initialLandingPageConfig;
  } catch {
    return initialLandingPageConfig;
  }
}

export function PageConfigPage() {
  const { notify, currentUser } = useCms();
  const [config, setConfig] = useState<LandingPageConfig>(loadLandingPageConfig);

  const isStaff = currentUser?.role === "staff";
  const staffAllowedSections = currentUser?.allowedSections || [
    "mission",
    "support",
    "process",
    "team",
    "gallery",
    "resources",
    "faq",
  ];

  // Danh sách các khối nội dung được phép hiển thị:
  // Nếu là Nhân viên: ẨN HẲN các mục không được phân quyền, không hiển thị khóa
  const visibleSections = useMemo(() => {
    if (!isStaff) return config.sections;
    return config.sections.filter((section) => staffAllowedSections.includes(section.id));
  }, [config.sections, isStaff, staffAllowedSections]);

  const [activeId, setActiveId] = useState<LandingSectionId>(() => {
    if (currentUser?.role === "staff") {
      const allowed = currentUser?.allowedSections || [
        "mission",
        "support",
        "process",
        "team",
        "gallery",
        "resources",
        "faq",
      ];
      return (allowed[0] as LandingSectionId) || "mission";
    }
    return "general";
  });

  // Tự động đảm bảo activeId luôn nằm trong danh sách visibleSections
  useEffect(() => {
    if (visibleSections.length > 0 && !visibleSections.some((s) => s.id === activeId)) {
      setActiveId(visibleSections[0].id);
    }
  }, [visibleSections, activeId]);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    fetch(CLOUD_API_URL, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.sections)) {
          setConfig(data);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      })
      .catch((err) => console.warn("Could not load from cloud:", err));
  }, []);

  const activeSection = useMemo(() => {
    const found = visibleSections.find((section) => section.id === activeId);
    return found || visibleSections[0] || config.sections[0];
  }, [activeId, visibleSections, config.sections]);

  const updateSection = (patch: Partial<LandingSection>) => {
    setConfig((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === activeId ? { ...section, ...patch } : section,
      ),
    }));
    setDirty(true);
  };

  const updateItem = (
    itemId: string,
    field: "title" | "description" | "meta" | "image",
    value: string,
  ) => {
    updateSection({
      items: activeSection.items?.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    });
  };

  const addItem = () => {
    const index = (activeSection.items?.length ?? 0) + 1;
    updateSection({
      items: [
        ...(activeSection.items ?? []),
        {
          id: `${activeId}-${Date.now()}`,
          title: `Nội dung mới ${index}`,
          description: "Nhập nội dung mô tả tại đây.",
        },
      ],
    });
  };

  const removeItem = (itemId: string) => {
    updateSection({ items: activeSection.items?.filter((item) => item.id !== itemId) });
  };

  const save = async (publish = false, overrideConfig?: LandingPageConfig) => {
    if (publish && isStaff) {
      alert("Tài khoản của bạn là Nhân viên nên chỉ có quyền Lưu bản nháp.\nVui lòng nhờ Quản trị viên (admin) kiểm tra và Xuất bản website.");
      notify("Nhân viên chỉ được phép Lưu bản nháp.");
      return;
    }
    const targetConfig = overrideConfig || config;
    setSaving(true);
    notify(publish ? "Đang xuất bản & đồng bộ đám mây..." : "Đang lưu bản nháp...");

    // 1. Lưu cục bộ
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(targetConfig));
    window.localStorage.setItem(`${STORAGE_KEY}:status`, publish ? "published" : "draft");

    // 2. Phát tín hiệu thời gian thực cho các tab đang mở
    try {
      const channel = new BroadcastChannel("aurora-cms-sync");
      channel.postMessage({ type: "config_updated", config: targetConfig, publish });
      channel.close();
    } catch {}

    // 3. Đồng bộ lên máy chủ đám mây để tất cả thiết bị/người dùng đều thấy
    try {
      await fetch(CLOUD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetConfig),
      });
      notify(publish ? "Đã xuất bản & đồng bộ dữ liệu toàn hệ thống!" : "Đã lưu bản nháp thành công!");
    } catch {
      notify("Đã lưu cục bộ (kết nối máy chủ tạm thời gián đoạn)");
    } finally {
      setSaving(false);
      setDirty(false);
    }
  };

  const handleApplyAiConfig = async (newConfig: LandingPageConfig, publishImmediately: boolean) => {
    setConfig(newConfig);
    setDirty(!publishImmediately);
    notify(publishImmediately ? "Đang đồng bộ dữ liệu AI lên website..." : "Đã cập nhật cấu hình từ AI!");
    if (publishImmediately) {
      await save(true, newConfig);
    }
  };

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `landing-page-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify("Đã tải file cấu hình JSON");
  };

  const importJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.sections && parsed.siteName) {
          setConfig(parsed);
          setDirty(true);
          notify("Đã nhập cấu hình từ file thành công! Hãy bấm 'Xuất bản thay đổi'");
        } else {
          alert("File JSON không đúng định dạng cấu hình");
        }
      } catch {
        alert("Không thể đọc file JSON này");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <PageHeading
        eyebrow="NỘI DUNG LANDING PAGE"
        title="Cấu hình trang"
        description="Quản lý toàn bộ thông tin và các khối nội dung đang hiển thị trên website."
        action={
          <div className="config-actions">
            <button
              className="ai-trigger-button"
              onClick={() => setShowAiModal(true)}
              type="button"
              title="Tự động cấu hình toàn bộ hoặc từng phần website bằng AI"
            >
              <Icon name="sparkle" size={16} />
              Trợ lý AI
            </button>
            {!isStaff && (
              <label className="secondary-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Icon name="page" size={15} />
                Nhập JSON
                <input type="file" accept=".json" onChange={importJson} style={{ display: "none" }} />
              </label>
            )}
            <button className="secondary-button" onClick={exportJson} title="Tải file cấu hình JSON về máy">
              <Icon name="share" size={15} />
              Xuất JSON
            </button>
            <button className="secondary-button" disabled={saving} onClick={() => save(false)}>
              Lưu bản nháp
            </button>
            {!isStaff && (
              <button className="primary-button" disabled={saving} onClick={() => save(true)}>
                <Icon name="check" size={16} />
                {saving ? "Đang đồng bộ..." : "Xuất bản thay đổi"}
              </button>
            )}
          </div>
        }
      />

      <div className="config-status">
        <span className="publish-state"><i /> Website đang hoạt động</span>
        <span>{dirty ? "Có thay đổi chưa lưu" : "Tất cả thay đổi đã được lưu"}</span>
        <a className="config-url" href="https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources" target="_blank" rel="noreferrer">
          tre-tu-ky-responsive
        </a>
      </div>

      <section className="page-config-layout">
        <aside className="section-list">
          <div className="section-list-heading">
            <strong>Cấu trúc trang chủ</strong>
            <small>{visibleSections.filter((section) => section.enabled).length} khối đang hiển thị</small>
          </div>
          <nav aria-label="Các khối nội dung landing page">
            {visibleSections.map((section, index) => {
              return (
                <button
                  className={activeId === section.id ? "active" : ""}
                  key={section.id}
                  onClick={() => setActiveId(section.id)}
                >
                  <span>
                    {section.id === "general" ? (
                      <Icon name="settings" size={15} />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span>
                    <strong>{section.label}</strong>
                    <small>{section.enabled ? "Đang hiển thị" : "Đang ẩn"}</small>
                  </span>
                  <i className={section.enabled ? "visible" : ""} />
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="config-editor">
          <div className="editor-heading">
            <div>
              <span>{activeSection.id === "general" ? "THÔNG TIN WEBSITE" : `KHỐI ${activeSection.label.toUpperCase()}`}</span>
              <h2>{activeSection.title}</h2>
              <p>{activeSection.id === "general" ? activeSection.description : "Chỉnh sửa nội dung đang hiển thị trên landing page."}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="ai-section-button"
                onClick={() => setShowAiModal(true)}
                title="Yêu cầu AI viết lại hoặc nâng cấp nội dung mục này"
              >
                <Icon name="sparkle" size={14} />
                Viết lại bằng AI
              </button>
              {activeSection.id !== "general" && (
                <label className="visibility-control">
                  <span>
                    <strong>Hiển thị khối</strong>
                    <small>Ẩn hoặc hiện trên trang chính</small>
                  </span>
                  <button
                    aria-label="Thay đổi trạng thái hiển thị"
                    className={activeSection.enabled ? "toggle enabled" : "toggle"}
                    onClick={() => updateSection({ enabled: !activeSection.enabled })}
                  >
                    <i />
                  </button>
                </label>
              )}
            </div>
          </div>

          {activeSection.id === "general" ? (
            <GeneralSettings
              config={config}
              onChange={(field, value) => {
                setConfig((current) => ({ ...current, [field]: value }));
                setDirty(true);
              }}
              onNavigationChange={(index, field, value) => {
                setConfig((current) => ({
                  ...current,
                  navigation: current.navigation.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, [field]: value } : item,
                  ),
                }));
                setDirty(true);
              }}
            />
          ) : (
            <SectionEditor
              section={activeSection}
              onChange={updateSection}
              onItemChange={updateItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
            />
          )}
        </div>

        <aside className="config-preview">
          <div className="preview-heading">
            <span><Icon name="eye" size={15} /> Xem trước nội dung</span>
            <small>Desktop</small>
          </div>
          <div className="mini-browser" style={{ position: "relative" }}>
            <div className="browser-bar"><i /><i /><i /><span>cothuong.vn</span></div>
            <div className={`mini-section mini-section--${activeSection.id}`} style={{ position: "relative", minHeight: 180 }}>
              {/* Mini floating contact dock preview */}
              <div
                className="mini-floating-preview"
                style={{
                  position: "absolute",
                  bottom: 10,
                  [config.floatingPosition === "left" ? "left" : "right"]: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: "center",
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                {config.enableFloatingFacebook !== false && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1877f2, #0d65d9)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                    title="Facebook"
                  >
                    f
                  </span>
                )}
                {config.enableFloatingZalo !== false && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0068ff, #0052cc)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                    title="Zalo"
                  >
                    Zalo
                  </span>
                )}
                {config.enableFloatingPhone !== false && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2d9935, #227929)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                    title="Hotline"
                  >
                    📞
                  </span>
                )}
                {config.enableBackToTop !== false && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6d2c8b, #50008b)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                    title="Back to top"
                  >
                    ↑
                  </span>
                )}
              </div>
              {activeSection.id === "general" ? (
                <>
                  <div className="mini-nav">
                    <span className="mini-logo">C</span>
                    <strong>{config.siteName}</strong>
                    <b>{config.consultationLabel}</b>
                  </div>
                  <div className="mini-general-lines"><i /><i /><i /></div>
                </>
              ) : (
                <>
                  {activeSection.eyebrow && <small>{activeSection.eyebrow}</small>}
                  <h3>{activeSection.title}</h3>
                  <p>{activeSection.description}</p>
                  {activeSection.image && <div className="mini-image"><Icon name="eye" size={19} /><span>{activeSection.image}</span></div>}
                  {activeSection.id === "team" ? (
                    <div className="mini-team-list">
                      {activeSection.items?.slice(0, 4).map((item) => (
                        <div key={item.id} className="mini-team-item">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="mini-avatar" />
                          ) : (
                            <span className="mini-avatar-placeholder"><Icon name="profile" size={14} /></span>
                          )}
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.meta || "Chuyên môn"}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeSection.items && (
                    <div className="mini-items">
                      {activeSection.items.slice(0, 6).map((item) => (
                        <span key={item.id}><i />{item.title}</span>
                      ))}
                    </div>
                  )}
                  {activeSection.primaryAction && <button>{activeSection.primaryAction}</button>}
                </>
              )}
            </div>
          </div>
          <div className="preview-note">
            <Icon name="eye" size={16} />
            <p>Bản xem trước thể hiện cấu trúc nội dung. Hình ảnh và bố cục đầy đủ sẽ hiển thị trên website.</p>
          </div>
        </aside>
      </section>

      <AiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        currentConfig={config}
        activeSectionId={activeId}
        onApply={handleApplyAiConfig}
      />
    </>
  );
}

function GeneralSettings({
  config,
  onChange,
  onNavigationChange,
}: {
  config: LandingPageConfig;
  onChange: (field: keyof LandingPageConfig, value: any) => void;
  onNavigationChange: (index: number, field: "label" | "path", value: string) => void;
}) {
  return (
    <div className="config-form">
      {/* Quick jump navigation */}
      <div className="general-quick-nav">
        <a href="#section-brand">🏷️ Nhận diện thương hiệu</a>
        <a href="#section-contact-info">📞 Thông tin liên hệ</a>
        <a href="#section-floating-dock" className="highlight-pill">⚡ Bộ nút liên hệ nổi (FB, Zalo, Hotline)</a>
        <a href="#section-navigation">🧭 Menu điều hướng</a>
      </div>

      {/* 1. Nhận diện thương hiệu */}
      <div className="form-section" id="section-brand">
        <div className="form-section-title">
          <strong>Nhận diện thương hiệu</strong>
          <p>Thông tin xuất hiện tại đầu và cuối trang.</p>
        </div>
        <div className="form-grid">
          <label className="field-wide">
            Tên đầy đủ
            <input value={config.siteName} onChange={(event) => onChange("siteName", event.target.value)} />
          </label>
          <label>
            Tên rút gọn
            <input value={config.shortName} onChange={(event) => onChange("shortName", event.target.value)} />
          </label>
          <label>
            Nhãn nút tư vấn
            <input value={config.consultationLabel} onChange={(event) => onChange("consultationLabel", event.target.value)} />
          </label>
          <MediaField label="Logo website" value={config.logo} onChange={(value) => onChange("logo", value)} />
        </div>
      </div>

      {/* 2. Thông tin liên hệ cơ bản */}
      <div className="form-section" id="section-contact-info">
        <div className="form-section-title">
          <strong>Thông tin liên hệ & Địa chỉ</strong>
          <p>Dùng cho biểu mẫu tư vấn và thông tin chân trang.</p>
        </div>
        <div className="form-grid">
          <label>Số điện thoại<input value={config.phone} onChange={(event) => onChange("phone", event.target.value)} /></label>
          <label>Email<input type="email" value={config.email} onChange={(event) => onChange("email", event.target.value)} /></label>
          <label className="field-wide">Địa chỉ trung tâm<input value={config.address} onChange={(event) => onChange("address", event.target.value)} /></label>
        </div>
      </div>

      {/* 3. BỘ NÚT LIÊN HỆ NỔI & TIỆN ÍCH (FLOATING CONTACT DOCK) */}
      <div className="form-section" id="section-floating-dock">
        <div className="form-section-title">
          <strong>Bộ nút liên hệ nổi & Tiện ích (Floating Contact Dock)</strong>
          <p>Tùy chỉnh các nút liên hệ cố định ở góc màn hình: Facebook, Zalo, Hotline gọi ngay và Cuộn trang.</p>
        </div>
        
        <div className="floating-dock-config-grid">
          {/* Card Facebook */}
          <div className="dock-card">
            <div className="dock-card-header">
              <div className="dock-card-title">
                <span className="dock-icon dock-icon--fb">f</span>
                <div>
                  <strong>Nút Facebook Messenger</strong>
                  <small>Mở fanpage hoặc nhắn tin</small>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${config.enableFloatingFacebook !== false ? "enabled" : ""}`}
                onClick={() => onChange("enableFloatingFacebook", config.enableFloatingFacebook === false)}
                aria-label="Bật tắt nút Facebook nổi"
              >
                <i />
              </button>
            </div>
            <label className="dock-field-label">
              Đường dẫn Facebook Fanpage / Messenger
              <input
                type="text"
                value={config.facebook || ""}
                placeholder="https://www.facebook.com/..."
                onChange={(event) => onChange("facebook", event.target.value)}
              />
            </label>
          </div>

          {/* Card Zalo */}
          <div className="dock-card">
            <div className="dock-card-header">
              <div className="dock-card-title">
                <span className="dock-icon dock-icon--zalo">Zalo</span>
                <div>
                  <strong>Nút Zalo Chat tư vấn</strong>
                  <small>Chat Zalo nhanh với phụ huynh</small>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${config.enableFloatingZalo !== false ? "enabled" : ""}`}
                onClick={() => onChange("enableFloatingZalo", config.enableFloatingZalo === false)}
                aria-label="Bật tắt nút Zalo nổi"
              >
                <i />
              </button>
            </div>
            <label className="dock-field-label">
              Số điện thoại Zalo hoặc link Zalo OA
              <input
                type="text"
                value={config.zalo || ""}
                placeholder="096 290 3942 hoặc https://zalo.me/..."
                onChange={(event) => onChange("zalo", event.target.value)}
              />
            </label>
          </div>

          {/* Card Hotline */}
          <div className="dock-card">
            <div className="dock-card-header">
              <div className="dock-card-title">
                <span className="dock-icon dock-icon--phone">
                  <Icon name="phone" size={16} />
                </span>
                <div>
                  <strong>Nút Hotline gọi ngay</strong>
                  <small>Bấm gọi trực tiếp (tel:)</small>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${config.enableFloatingPhone !== false ? "enabled" : ""}`}
                onClick={() => onChange("enableFloatingPhone", config.enableFloatingPhone === false)}
                aria-label="Bật tắt nút Hotline nổi"
              >
                <i />
              </button>
            </div>
            <label className="dock-field-label">
              Số điện thoại Hotline
              <input
                type="text"
                value={config.phone || ""}
                placeholder="096 290 3942"
                onChange={(event) => onChange("phone", event.target.value)}
              />
            </label>
          </div>

          {/* Card Tùy chọn hiển thị & Vị trí */}
          <div className="dock-card dock-card--full">
            <div className="dock-options-grid">
              {/* Toggle Back to Top */}
              <div className="dock-option-item">
                <button
                  type="button"
                  className={`toggle ${config.enableBackToTop !== false ? "enabled" : ""}`}
                  onClick={() => onChange("enableBackToTop", config.enableBackToTop === false)}
                  aria-label="Bật tắt nút cuộn trang"
                >
                  <i />
                </button>
                <div>
                  <strong>Nút Cuộn lên đầu trang (Back to top)</strong>
                  <small>Hiện nút mũi tên khi phụ huynh cuộn xuống đọc</small>
                </div>
              </div>

              {/* Toggle Pulse Wave */}
              <div className="dock-option-item">
                <button
                  type="button"
                  className={`toggle ${config.enableFloatingPulse !== false ? "enabled" : ""}`}
                  onClick={() => onChange("enableFloatingPulse", config.enableFloatingPulse === false)}
                  aria-label="Bật tắt hiệu ứng phát xung"
                >
                  <i />
                </button>
                <div>
                  <strong>Hiệu ứng sóng động lực (Pulse Wave)</strong>
                  <small>Vòng tròn lan tỏa nhấp nháy tạo sự chú ý</small>
                </div>
              </div>

              {/* Position selector */}
              <div className="dock-option-item dock-option-item--select">
                <div>
                  <strong>Vị trí hiển thị trên màn hình</strong>
                  <small>Vị trí cố định của bộ nút dock</small>
                </div>
                <select
                  value={config.floatingPosition || "right"}
                  onChange={(event) => onChange("floatingPosition", event.target.value as "right" | "left")}
                >
                  <option value="right">Góc dưới bên phải (Thuận ngón cái - Khuyên dùng)</option>
                  <option value="left">Góc dưới bên trái</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Điều hướng chính */}
      <div className="form-section" id="section-navigation">
        <div className="form-section-title">
          <strong>Điều hướng chính</strong>
          <p>Các liên kết xuất hiện trên thanh menu đầu trang.</p>
        </div>
        <div className="menu-config">
          {config.navigation.map((item, index) => (
            <div key={`${item.path}-${index}`}>
              <span>{index + 1}</span>
              <input value={item.label} onChange={(event) => onNavigationChange(index, "label", event.target.value)} />
              <input className="menu-path-input" value={item.path} onChange={(event) => onNavigationChange(index, "path", event.target.value)} />
              <button aria-label={`Tùy chọn ${item.label}`}><Icon name="more" size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onItemChange,
  onRemoveItem,
  onAddItem,
}: {
  section: LandingSection;
  onChange: (patch: Partial<LandingSection>) => void;
  onItemChange: (itemId: string, field: "title" | "description" | "meta" | "image", value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: () => void;
}) {
  return (
    <div className="config-form">
      <div className="form-section">
        <div className="form-section-title">
          <strong>Nội dung chính</strong>
          <p>Tiêu đề và mô tả giới thiệu cho khối.</p>
        </div>
        <div className="form-grid">
          {section.eyebrow !== undefined && (
            <label className="field-wide">Dòng giới thiệu<input value={section.eyebrow} onChange={(event) => onChange({ eyebrow: event.target.value })} /></label>
          )}
          <label className="field-wide">Tiêu đề khối<input value={section.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
          <label className="field-wide">Mô tả<textarea value={section.description} onChange={(event) => onChange({ description: event.target.value })} /></label>
          {section.image && <MediaField label="Hình ảnh chính" value={section.image} onChange={(value) => onChange({ image: value })} />}
          {section.primaryAction !== undefined && <label>Nút chính<input value={section.primaryAction} onChange={(event) => onChange({ primaryAction: event.target.value })} /></label>}
          {section.secondaryAction !== undefined && <label>Nút phụ<input value={section.secondaryAction} onChange={(event) => onChange({ secondaryAction: event.target.value })} /></label>}
        </div>
      </div>

      {section.items && (
        <div className="form-section">
          <div className="form-section-title form-section-title--action">
            <div><strong>Danh sách nội dung</strong><p>{section.items.length} mục đang được cấu hình.</p></div>
            <button onClick={onAddItem}><Icon name="plus" size={15} /> Thêm mục</button>
          </div>
          <div className="repeatable-list">
            {section.items.map((item, index) => (
              <article key={item.id}>
                <header>
                  <span>{item.meta && /^\d+$/.test(item.meta) ? item.meta : String(index + 1).padStart(2, "0")}</span>
                  <strong>Mục {index + 1}</strong>
                  <button aria-label={`Xóa mục ${index + 1}`} onClick={() => onRemoveItem(item.id)}><Icon name="close" size={15} /></button>
                </header>
                <div className="form-grid">
                  <label className="field-wide">Tiêu đề / Tên<input value={item.title} onChange={(event) => onItemChange(item.id, "title", event.target.value)} /></label>
                  {item.meta !== undefined && !/^\d+$/.test(item.meta) && <label className="field-wide">Chuyên môn / Vai trò<input value={item.meta} onChange={(event) => onItemChange(item.id, "meta", event.target.value)} /></label>}
                  {item.description !== undefined && <label className="field-wide">Mô tả giới thiệu<textarea value={item.description} onChange={(event) => onItemChange(item.id, "description", event.target.value)} /></label>}
                  
                  {/* Mục 5: Thêm ảnh chân dung cho Đội ngũ giáo viên */}
                  {section.id === "team" && (
                    <ItemImageField
                      label="Ảnh chân dung giáo viên"
                      value={item.image || ""}
                      onChange={(val) => onItemChange(item.id, "image", val)}
                    />
                  )}

                  {/* Ảnh không gian phòng học */}
                  {section.id === "gallery" && (
                    <ItemImageField
                      label="Hình ảnh không gian"
                      value={item.meta || ""}
                      onChange={(val) => onItemChange(item.id, "meta", val)}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function compressImageFile(file: File, maxWidth = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ItemImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 480, 0.85);
      onChange(compressedDataUrl);
    } catch {
      alert("Không thể đọc tệp ảnh này");
    }
  };

  return (
    <div className="field-wide item-image-field">
      <span className="item-image-label">{label}</span>
      <div className="item-image-row">
        <div className="item-image-thumb">
          {value ? (
            <img src={value} alt="Chân dung" />
          ) : (
            <div className="item-image-empty">
              <Icon name="profile" size={24} />
              <small>Chưa có ảnh</small>
            </div>
          )}
        </div>
        <div className="item-image-controls">
          <label className="upload-btn">
            <Icon name="page" size={15} />
            {value ? "Thay ảnh mới" : "Tải ảnh từ máy"}
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          <button
            type="button"
            className="secondary-btn-sm"
            onClick={() => setEditingUrl(!editingUrl)}
          >
            {editingUrl ? "Đóng URL" : "Dán link ảnh"}
          </button>
          {value && (
            <button
              type="button"
              className="danger-btn-sm"
              onClick={() => onChange("")}
              title="Xóa ảnh chân dung này"
            >
              <Icon name="close" size={14} /> Xóa ảnh
            </button>
          )}
        </div>
      </div>
      {editingUrl && (
        <div className="item-image-url-input">
          <input
            type="text"
            placeholder="Dán đường dẫn ảnh https://... hoặc ./images/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button
            type="button"
            className="secondary-btn-sm"
            onClick={() => {
              onChange(urlInput.trim());
              setEditingUrl(false);
            }}
          >
            Lưu
          </button>
        </div>
      )}
    </div>
  );
}

function MediaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
}) {
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onChange) return;
    try {
      const dataUrl = await compressImageFile(file, 960, 0.85);
      onChange(dataUrl);
    } catch {
      onChange(file.name);
    }
  };

  return (
    <label className="field-wide">
      {label}
      <span className="media-field">
        <span><Icon name="page" size={18} /></span>
        <span>
          <strong>{value.startsWith("data:") ? "Ảnh đã tải lên (Dung lượng nhẹ)" : value}</strong>
          <small>JPG, PNG hoặc WEBP · Tối đa 5MB</small>
        </span>
        <span className="media-upload">
          Thay ảnh
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleUpload}
          />
        </span>
      </span>
    </label>
  );
}
