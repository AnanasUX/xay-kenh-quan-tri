import { useEffect, useMemo, useState, useRef } from "react";
import { AiAssistantModal } from "./AiAssistantModal";
import { AiSectionRewriteModal } from "./AiSectionRewriteModal";
import { GoogleSheetsConfigModal } from "./GoogleSheetsConfigModal";
import { getGoogleSheetsUrl, backupConfigToGoogleSheets } from "./googleSheetsService";
import { logAuditAction } from "./auditService";
import { ImageCropperModal, CROP_SPECS, type CropTargetSpec } from "./ImageCropperModal";
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
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  // 1. Tải cấu hình từ cloud khi vào trang, nhưng tôn trọng bản nháp chưa xuất bản ở localStorage
  useEffect(() => {
    fetch(CLOUD_API_URL, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.sections)) {
          const status = window.localStorage.getItem(`${STORAGE_KEY}:status`);
          const savedLocal = window.localStorage.getItem(STORAGE_KEY);
          // Nếu có bản nháp chưa xuất bản tại local (status === 'draft'), ưu tiên giữ bản nháp của người dùng
          if (status === "draft" && savedLocal) {
            try {
              const localParsed = JSON.parse(savedLocal);
              if (localParsed && Array.isArray(localParsed.sections)) {
                setConfig(localParsed);
                setDirty(true);
                return;
              }
            } catch {}
          }
          setConfig(data);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      })
      .catch((err) => console.warn("Could not load from cloud:", err));
  }, []);

  // 2. Tự động lưu bản nháp vào localStorage mỗi khi có chỉnh sửa (đính kèm ảnh, sửa chữ...) để reload không bị mất
  useEffect(() => {
    if (dirty) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        window.localStorage.setItem(`${STORAGE_KEY}:status`, "draft");
      } catch (e) {
        console.warn("Could not auto-save draft to localStorage:", e);
      }
    }
  }, [config, dirty]);

  // 3. Cảnh báo trước khi rời trang / reload nếu chưa bấm xuất bản
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "Bạn có thay đổi chưa xuất bản. Bạn có chắc chắn muốn tải lại trang?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

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
      logAuditAction({
        username: currentUser?.username || "nhanvien",
        fullName: currentUser?.fullName || "Nhân viên",
        role: "staff",
        category: "publish",
        action: "Từ chối quyền Xuất bản website",
        detail: "Tài khoản Nhân viên không được phép xuất bản toàn trang. Hệ thống đã ngăn chặn.",
        target: "Toàn trang",
        status: "denied",
      });
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

    // 4. Tự động sao lưu lên Google Trang tính nếu đã kết nối
    if (getGoogleSheetsUrl()) {
      backupConfigToGoogleSheets(targetConfig).catch((e) => console.warn("Google Sheets backup error:", e));
    }

    logAuditAction({
      username: currentUser?.username || "admin",
      fullName: currentUser?.fullName || "Người dùng",
      role: currentUser?.role || "admin",
      category: publish ? "publish" : "draft",
      action: publish ? "Xuất bản website lên trang chính" : `Lưu bản nháp khối: ${activeSection.title}`,
      detail: publish
        ? "Đã đồng bộ toàn bộ dữ liệu cấu hình lên máy chủ đám mây và landing page chính"
        : `Đã lưu bản nháp chỉnh sửa nội dung khối [${activeSection.label || activeSection.id}]`,
      target: activeSection.id,
      status: "success",
    });
  };

  const handleApplyAiConfig = async (newConfig: LandingPageConfig, publishImmediately: boolean) => {
    setConfig(newConfig);
    setDirty(!publishImmediately);
    notify(publishImmediately ? "Đang đồng bộ dữ liệu AI lên website..." : "Đã cập nhật cấu hình từ AI!");
    logAuditAction({
      username: currentUser?.username || "admin",
      fullName: currentUser?.fullName || "Quản trị viên",
      role: currentUser?.role || "admin",
      category: "ai",
      action: "Áp dụng nội dung do Trợ lý AI tạo",
      detail: "Áp dụng cấu hình và nội dung mới do AI đề xuất vào các khối website",
      status: "success",
    });
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
    logAuditAction({
      username: currentUser?.username || "admin",
      fullName: currentUser?.fullName || "Quản trị viên",
      role: currentUser?.role || "admin",
      category: "config",
      action: "Xuất file cấu hình website (JSON)",
      detail: "Tải bản sao lưu cấu hình toàn bộ trang về máy tính",
      status: "success",
    });
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
          logAuditAction({
            username: currentUser?.username || "admin",
            fullName: currentUser?.fullName || "Quản trị viên",
            role: currentUser?.role || "admin",
            category: "config",
            action: "Nhập cấu hình website từ file JSON",
            detail: `Đã nhập cấu hình thành công từ tệp tin "${file.name}"`,
            status: "success",
          });
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
              <span>Trợ lý AI</span>
            </button>
            {!isStaff && (
              <label className="secondary-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Icon name="upload" size={15} />
                <span>Nhập JSON</span>
                <input type="file" accept=".json" onChange={importJson} style={{ display: "none" }} />
              </label>
            )}
            <button className="secondary-button" onClick={exportJson} title="Tải file cấu hình JSON về máy">
              <Icon name="download" size={15} />
              <span>Xuất JSON</span>
            </button>
            <button
              className="secondary-button"
              onClick={() => setShowSheetsModal(true)}
              type="button"
              title="Sao lưu hoặc kết nối cấu hình với Google Trang tính"
            >
              <Icon name="link" size={15} />
              <span>Google Trang tính</span>
            </button>
            <button className="secondary-button" disabled={saving} onClick={() => save(false)}>
              <Icon name="edit" size={15} />
              <span>Lưu bản nháp</span>
            </button>
            {!isStaff && (
              <button className="primary-button" disabled={saving} onClick={() => save(true)}>
                <Icon name="check" size={16} />
                <span>{saving ? "Đang đồng bộ..." : "Xuất bản thay đổi"}</span>
              </button>
            )}
          </div>
        }
      />

      <div className="config-status" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span className="publish-state"><i /> Website đang hoạt động</span>
        <span>{dirty ? "Có thay đổi chưa lưu" : "Tất cả thay đổi đã được lưu"}</span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            navigator.clipboard.writeText("https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources");
            notify("Đã sao chép liên kết chiến dịch Zalo vào khay nhớ tạm!");
          }}
          style={{ padding: "4px 10px", fontSize: "12px", height: "28px", display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer" }}
          title="Sao chép liên kết chiến dịch Zalo có tracking zarsrc=30"
        >
          <Icon name="copy" size={13} />
          <span>Sao chép link Zalo Campaign</span>
        </button>
        <a className="config-url" href="https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources" target="_blank" rel="noreferrer">
          ↗ Mở Landing Page
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
                onClick={() => setShowRewriteModal(true)}
                title="Yêu cầu AI viết lại hoặc nâng cấp nội dung mục này (Có tự động sao lưu dự phòng)"
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
                      width: Math.round(((config.floatingButtonSize || 52) / 52) * 22),
                      height: Math.round(((config.floatingButtonSize || 52) / 52) * 22),
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1877f2, #0d65d9)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      overflow: "hidden",
                    }}
                    title="Facebook"
                  >
                    {config.floatingFacebookIcon ? (
                      <img src={config.floatingFacebookIcon} alt="FB" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    ) : (
                      "f"
                    )}
                  </span>
                )}
                {config.enableFloatingZalo !== false && (
                  <span
                    style={{
                      width: Math.round(((config.floatingButtonSize || 52) / 52) * 22),
                      height: Math.round(((config.floatingButtonSize || 52) / 52) * 22),
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0068ff, #0052cc)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      overflow: "hidden",
                    }}
                    title="Zalo"
                  >
                    {config.floatingZaloIcon ? (
                      <img src={config.floatingZaloIcon} alt="Zalo" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    ) : (
                      "Zalo"
                    )}
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
                  ) : Array.isArray(activeSection.items) && (
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

      <GoogleSheetsConfigModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        currentConfig={config}
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
          <MediaField
            label="Logo website"
            value={config.logo}
            onChange={(value) => onChange("logo", value)}
            spec={CROP_SPECS.logo}
          />
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
            <label className="dock-field-label" style={{ marginTop: 8 }}>
              Ảnh biểu tượng icon Facebook tùy chỉnh (Icon Size: 24×24px)
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                {config.floatingFacebookIcon && (
                  <img
                    src={config.floatingFacebookIcon}
                    alt="Facebook"
                    style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4, background: "#f1f5f9", padding: 2, border: "1px solid #cbd5e1" }}
                  />
                )}
                <input
                  type="text"
                  value={config.floatingFacebookIcon || ""}
                  placeholder="URL ảnh hoặc bấm nút chọn file..."
                  onChange={(event) => onChange("floatingFacebookIcon", event.target.value)}
                  style={{ flex: 1 }}
                />
                <label className="secondary-button" style={{ padding: "0 10px", height: 36, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Icon name="upload" size={13} />
                  <span>Chọn file</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onChange("floatingFacebookIcon", ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <small style={{ color: "#64748b", fontSize: 11, marginTop: 2, display: "block" }}>
                Kích thước icon hiển thị: <strong>24 × 24 px</strong>. Hỗ trợ ảnh trong suốt PNG/SVG.
              </small>
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
            <label className="dock-field-label" style={{ marginTop: 8 }}>
              Ảnh biểu tượng icon Zalo tùy chỉnh (Icon Size: 24×24px)
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                {config.floatingZaloIcon && (
                  <img
                    src={config.floatingZaloIcon}
                    alt="Zalo"
                    style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4, background: "#f1f5f9", padding: 2, border: "1px solid #cbd5e1" }}
                  />
                )}
                <input
                  type="text"
                  value={config.floatingZaloIcon || ""}
                  placeholder="URL ảnh hoặc bấm nút chọn file..."
                  onChange={(event) => onChange("floatingZaloIcon", event.target.value)}
                  style={{ flex: 1 }}
                />
                <label className="secondary-button" style={{ padding: "0 10px", height: 36, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Icon name="upload" size={13} />
                  <span>Chọn file</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onChange("floatingZaloIcon", ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <small style={{ color: "#64748b", fontSize: 11, marginTop: 2, display: "block" }}>
                Kích thước icon hiển thị: <strong>24 × 24 px</strong>. Hỗ trợ ảnh trong suốt PNG/SVG.
              </small>
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
            <label className="dock-field-label" style={{ marginTop: 8 }}>
              Ảnh biểu tượng icon Hotline tùy chỉnh (Icon Size: 24×24px)
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                {config.floatingPhoneIcon && (
                  <img
                    src={config.floatingPhoneIcon}
                    alt="Hotline"
                    style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4, background: "#f1f5f9", padding: 2, border: "1px solid #cbd5e1" }}
                  />
                )}
                <input
                  type="text"
                  value={config.floatingPhoneIcon || ""}
                  placeholder="URL ảnh hoặc bấm nút chọn file..."
                  onChange={(event) => onChange("floatingPhoneIcon", event.target.value)}
                  style={{ flex: 1 }}
                />
                <label className="secondary-button" style={{ padding: "0 10px", height: 36, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Icon name="upload" size={13} />
                  <span>Chọn file</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onChange("floatingPhoneIcon", ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <small style={{ color: "#64748b", fontSize: 11, marginTop: 2, display: "block" }}>
                Kích thước icon hiển thị: <strong>24 × 24 px</strong>. Hỗ trợ ảnh trong suốt PNG/SVG.
              </small>
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

              {/* Button Size selector */}
              <div className="dock-option-item dock-option-item--select">
                <div>
                  <strong>Kích thước của các nút liên hệ nổi</strong>
                  <small>Đường kính chuẩn: {config.floatingButtonSize || 52}px (Icon: 24×24px)</small>
                </div>
                <select
                  value={config.floatingButtonSize || 52}
                  onChange={(event) => onChange("floatingButtonSize", parseInt(event.target.value, 10))}
                >
                  <option value={48}>48 × 48 px — Chuẩn công thái học ngón cái Google/Apple</option>
                  <option value={52}>52 × 52 px — Tiêu chuẩn cân đối trực quan (Khuyên dùng)</option>
                  <option value={56}>56 × 56 px — Kích thước lớn, nổi bật dễ thao tác</option>
                </select>
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
          {(section.image !== undefined || section.id === "hero" || section.id === "gallery") && (
            <MediaField
              label="Hình ảnh chính"
              value={section.image}
              onChange={(value) => onChange({ image: value })}
              spec={CROP_SPECS.sectionMain}
            />
          )}
          {section.primaryAction !== undefined && <label>Nút chính<input value={section.primaryAction} onChange={(event) => onChange({ primaryAction: event.target.value })} /></label>}
          {section.secondaryAction !== undefined && <label>Nút phụ<input value={section.secondaryAction} onChange={(event) => onChange({ secondaryAction: event.target.value })} /></label>}
        </div>
      </div>

      {section.items && (
        <div className="form-section">
          <div className="form-section-title form-section-title--action">
            <div><strong>Danh sách nội dung</strong><p>{section.items.length} mục đang được cấu hình.</p></div>
            <button type="button" className="btn-add-item" onClick={onAddItem}>
              <Icon name="plus" size={15} />
              <span>Thêm mục</span>
            </button>
          </div>
          <div className="repeatable-list">
            {section.items.map((item, index) => (
              <article key={item.id}>
                <header>
                  <span>{item.meta && /^\d+$/.test(item.meta) ? item.meta : String(index + 1).padStart(2, "0")}</span>
                  <strong>Mục {index + 1}</strong>
                  <button type="button" className="btn-remove-item" aria-label={`Xóa mục ${index + 1}`} onClick={() => onRemoveItem(item.id)} title={`Xóa mục ${index + 1}`}>
                    <Icon name="close" size={14} />
                  </button>
                </header>
                <div className="form-grid">
                  <label className="field-wide">Tiêu đề / Tên<input value={item.title} onChange={(event) => onItemChange(item.id, "title", event.target.value)} /></label>
                  {item.meta !== undefined && !/^\d+$/.test(item.meta) && <label className="field-wide">Chuyên môn / Vai trò<input value={item.meta} onChange={(event) => onItemChange(item.id, "meta", event.target.value)} /></label>}
                  {item.description !== undefined && <label className="field-wide">Mô tả giới thiệu<textarea value={item.description} onChange={(event) => onItemChange(item.id, "description", event.target.value)} /></label>}
                  
                  {/* Mục: Thêm ảnh chân dung cho Đội ngũ giáo viên */}
                  {section.id === "team" && (
                    <ItemImageField
                      label="Ảnh chân dung giáo viên"
                      value={item.image || ""}
                      onChange={(val) => onItemChange(item.id, "image", val)}
                      spec={CROP_SPECS.team}
                    />
                  )}

                  {/* Ảnh không gian phòng học */}
                  {section.id === "gallery" && (
                    <ItemImageField
                      label="Hình ảnh không gian"
                      value={item.meta || ""}
                      onChange={(val) => onItemChange(item.id, "meta", val)}
                      spec={CROP_SPECS.gallery}
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

function processUploadedImageFile(
  file: File,
  spec: CropTargetSpec,
  onRequiresCrop: (dataUrl: string, width: number, height: number) => void,
  onDirectApply: (dataUrl: string) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    const img = new Image();
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const userRatio = origW / origH;
      const ratioDiffSpec = Math.abs(userRatio - spec.aspectRatio) / spec.aspectRatio;
      const ratioDiff43 = Math.abs(userRatio - 4 / 3) / (4 / 3);
      const ratioDiff169 = Math.abs(userRatio - 16 / 9) / (16 / 9);

      // Điều kiện tự động nhận diện ảnh hợp lệ:
      // Khớp chuẩn 4:3 (Chuẩn khung Hero) hoặc 16:9 (Toàn cảnh) hoặc khớp spec hiện tại
      const isRatioFit = ratioDiffSpec <= 0.05 || ratioDiff43 <= 0.05 || ratioDiff169 <= 0.05;
      const isSizeFit = origW <= 1600 && origH <= 1200;

      if (isRatioFit && isSizeFit) {
        onDirectApply(dataUrl);
      } else {
        onRequiresCrop(dataUrl, origW, origH);
      }
    };
    img.onerror = () => onDirectApply(dataUrl);
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function ItemImageField({
  label,
  value,
  onChange,
  spec = CROP_SPECS.team,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  spec?: CropTargetSpec;
}) {
  const { notify, currentUser } = useCms();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const [cropperData, setCropperData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    origWidth: number;
    origHeight: number;
  }>({
    isOpen: false,
    imageSrc: "",
    origWidth: 0,
    origHeight: 0,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processUploadedImageFile(
      file,
      spec,
      (dataUrl, w, h) => {
        setCropperData({
          isOpen: true,
          imageSrc: dataUrl,
          origWidth: w,
          origHeight: h,
        });
      },
      (dataUrl) => {
        onChange(dataUrl);
        notify(`Ảnh vừa kích thước chuẩn (${spec.targetWidth}×${spec.targetHeight} px) - Đã đính kèm! Vui lòng bấm 'Xuất bản thay đổi' ở trên cùng để lưu vĩnh viễn.`);
      }
    );
    event.target.value = "";
  };

  return (
    <div className="field-wide item-image-field">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
        <span className="item-image-label">{label}</span>
        <span className="dimension-badge-inline">
          📐 Chuẩn: {spec.targetWidth} × {spec.targetHeight} px ({spec.aspectRatioLabel})
        </span>
      </div>

      <div className="item-image-row">
        <div className="item-image-thumb">
          {value ? (
            <img src={value} alt={label} />
          ) : (
            <div className="item-image-empty">
              <Icon name="profile" size={24} />
              <small>Chưa có ảnh</small>
            </div>
          )}
        </div>
        <div className="item-image-controls">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn-upload-primary"
            onClick={() => fileInputRef.current?.click()}
            title="Tải ảnh lên từ thiết bị của bạn"
          >
            <Icon name="upload" size={15} />
            <span>{value ? "Thay ảnh mới" : "Tải ảnh từ máy"}</span>
          </button>
          <button
            type="button"
            className="btn-link-action"
            onClick={() => setEditingUrl(!editingUrl)}
            title="Dán đường dẫn ảnh online"
          >
            <Icon name="link" size={14} />
            <span>{editingUrl ? "Đóng URL" : "Dán link ảnh"}</span>
          </button>
          {value && (
            <button
              type="button"
              className="btn-crop-action"
              onClick={() => {
                const img = new Image();
                img.onload = () => {
                  setCropperData({
                    isOpen: true,
                    imageSrc: value,
                    origWidth: img.naturalWidth || img.width,
                    origHeight: img.naturalHeight || img.height,
                  });
                };
                img.src = value;
              }}
              title="Cắt hoặc căn chỉnh lại khuôn hình ảnh"
            >
              <Icon name="crop" size={14} />
              <span>Chỉnh cắt ảnh</span>
            </button>
          )}
          {value && (
            <button
              type="button"
              className="btn-danger-action"
              onClick={() => onChange("")}
              title="Xóa ảnh này"
            >
              <Icon name="trash" size={14} />
              <span>Xóa ảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* Ghi chú kích thước tiêu chuẩn để sau người dùng làm đúng kích thước */}
      <div className="dimension-guide-pill">
        <span className="dimension-tag">
          📐 Kích thước chuẩn: {spec.targetWidth} × {spec.targetHeight} px ({spec.aspectRatioLabel})
        </span>
        <span className="dimension-desc">{spec.tip} (Tự động mở khung cắt nếu ảnh vượt kích thước)</span>
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

      {/* Khung cắt ảnh khi vượt quá kích thước hiện tại */}
      <ImageCropperModal
        isOpen={cropperData.isOpen}
        imageSrc={cropperData.imageSrc}
        origWidth={cropperData.origWidth}
        origHeight={cropperData.origHeight}
        spec={spec}
        onCropComplete={(croppedDataUrl) => {
          onChange(croppedDataUrl);
          setCropperData((p) => ({ ...p, isOpen: false }));
          notify(`Đã cắt ảnh chuẩn ${spec.targetWidth}×${spec.targetHeight} px thành công! Vui lòng bấm 'Xuất bản thay đổi' ở trên cùng để lưu vĩnh viễn.`);
          logAuditAction({
            username: currentUser?.username || "admin",
            fullName: currentUser?.fullName || "Người dùng",
            role: currentUser?.role || "admin",
            category: "config",
            action: `Cắt và cập nhật ${spec.name}`,
            detail: `Đã cắt ảnh kích thước chuẩn ${spec.targetWidth}×${spec.targetHeight} px (${spec.aspectRatioLabel}) cho ${label}`,
            status: "success",
          });
        }}
        onUseOriginal={() => {
          onChange(cropperData.imageSrc);
          setCropperData((p) => ({ ...p, isOpen: false }));
          notify("Đã áp dụng ảnh gốc nguyên bản.");
        }}
        onCancel={() => {
          setCropperData((p) => ({ ...p, isOpen: false }));
        }}
      />
    </div>
  );
}

function MediaField({
  label,
  value,
  onChange,
  spec = CROP_SPECS.sectionMain,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  spec?: CropTargetSpec;
}) {
  const { notify, currentUser } = useCms();
  const [cropperData, setCropperData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    origWidth: number;
    origHeight: number;
  }>({
    isOpen: false,
    imageSrc: "",
    origWidth: 0,
    origHeight: 0,
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onChange) return;

    processUploadedImageFile(
      file,
      spec,
      (dataUrl, w, h) => {
        setCropperData({
          isOpen: true,
          imageSrc: dataUrl,
          origWidth: w,
          origHeight: h,
        });
      },
      (dataUrl) => {
        onChange(dataUrl);
        notify(`Ảnh vừa kích thước chuẩn (${spec.targetWidth}×${spec.targetHeight} px) - Đã đính kèm! Vui lòng bấm 'Xuất bản thay đổi' ở trên cùng để lưu vĩnh viễn.`);
      }
    );
    event.target.value = "";
  };

  return (
    <div className="field-wide" style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{label}</span>
        <span className="dimension-badge-inline">
          📐 Chuẩn: {spec.targetWidth} × {spec.targetHeight} px ({spec.aspectRatioLabel})
        </span>
      </div>

      <div className="media-field">
        <span className="media-icon-badge">
          <Icon name="image" size={20} />
        </span>
        <span className="media-info-text">
          <strong>
            {value.startsWith("data:")
              ? "Ảnh tùy chỉnh đã tải lên & tối ưu"
              : value}
          </strong>
          <small>JPG, PNG hoặc WEBP · Tối đa 5MB</small>
        </span>
        <label className="btn-upload-primary" style={{ cursor: "pointer" }}>
          <Icon name="upload" size={15} />
          <span>Thay ảnh</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Ghi chú kích thước tiêu chuẩn để sau người dùng làm đúng kích thước */}
      <div className="dimension-guide-pill">
        <span className="dimension-tag">
          📐 Kích thước chuẩn: {spec.targetWidth} × {spec.targetHeight} px ({spec.aspectRatioLabel})
        </span>
        <span className="dimension-desc">{spec.tip} (Tự động mở khung cắt nếu ảnh vượt kích thước)</span>
      </div>

      {/* Khung cắt ảnh khi vượt quá kích thước hiện tại */}
      <ImageCropperModal
        isOpen={cropperData.isOpen}
        imageSrc={cropperData.imageSrc}
        origWidth={cropperData.origWidth}
        origHeight={cropperData.origHeight}
        spec={spec}
        onCropComplete={(croppedDataUrl) => {
          if (onChange) onChange(croppedDataUrl);
          setCropperData((p) => ({ ...p, isOpen: false }));
          notify(`Đã cắt ảnh chuẩn ${spec.targetWidth}×${spec.targetHeight} px thành công! Vui lòng bấm 'Xuất bản thay đổi' ở trên cùng để lưu vĩnh viễn.`);
          logAuditAction({
            username: currentUser?.username || "admin",
            fullName: currentUser?.fullName || "Người dùng",
            role: currentUser?.role || "admin",
            category: "config",
            action: `Cắt và cập nhật ${spec.name}`,
            detail: `Đã cắt ảnh kích thước chuẩn ${spec.targetWidth}×${spec.targetHeight} px (${spec.aspectRatioLabel}) cho ${label}`,
            status: "success",
          });
        }}
        onUseOriginal={() => {
          if (onChange) onChange(cropperData.imageSrc);
          setCropperData((p) => ({ ...p, isOpen: false }));
          notify("Đã áp dụng ảnh gốc nguyên bản.");
        }}
        onCancel={() => {
          setCropperData((p) => ({ ...p, isOpen: false }));
        }}
      />
    </div>
  );
}
