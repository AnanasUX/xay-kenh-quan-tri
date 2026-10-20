import { useMemo, useState } from "react";
import { initialLandingPageConfig, type LandingSection, type LandingSectionId } from "./landingPage";
import { useCms } from "./Layout";
import { Icon, PageHeading } from "./ui";

const STORAGE_KEY = "aurora-cms:landing-page";

function loadLandingPageConfig() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as typeof initialLandingPageConfig) : initialLandingPageConfig;
  } catch {
    return initialLandingPageConfig;
  }
}

export function PageConfigPage() {
  const { notify } = useCms();
  const [config, setConfig] = useState(loadLandingPageConfig);
  const [activeId, setActiveId] = useState<LandingSectionId>("general");
  const [dirty, setDirty] = useState(false);
  const activeSection = useMemo(
    () => config.sections.find((section) => section.id === activeId)!,
    [activeId, config.sections],
  );

  const updateSection = (patch: Partial<LandingSection>) => {
    setConfig((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === activeId ? { ...section, ...patch } : section,
      ),
    }));
    setDirty(true);
  };

  const updateItem = (itemId: string, field: "title" | "description" | "meta", value: string) => {
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

  const save = (publish = false) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.localStorage.setItem(`${STORAGE_KEY}:status`, publish ? "published" : "draft");
    try {
      const channel = new BroadcastChannel("aurora-cms-sync");
      channel.postMessage({ type: "config_updated", config, publish });
      channel.close();
    } catch {}
    setDirty(false);
    notify(publish ? "Đã xuất bản cấu hình landing page" : "Đã lưu bản nháp cấu hình");
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
            <label className="secondary-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
              <Icon name="page" size={15} />
              Nhập JSON
              <input type="file" accept=".json" onChange={importJson} style={{ display: "none" }} />
            </label>
            <button className="secondary-button" onClick={exportJson} title="Tải file cấu hình JSON về máy">
              <Icon name="share" size={15} />
              Xuất JSON
            </button>
            <button className="secondary-button" onClick={() => save(false)}>
              Lưu bản nháp
            </button>
            <button className="primary-button" onClick={() => save(true)}>
              <Icon name="check" size={16} />
              Xuất bản thay đổi
            </button>
          </div>
        }
      />

      <div className="config-status">
        <span className="publish-state"><i /> Website đang hoạt động</span>
        <span>{dirty ? "Có thay đổi chưa lưu" : "Tất cả thay đổi đã được lưu"}</span>
        <a className="config-url" href="https://ananasux.github.io/tre-tu-ky-responsive/" target="_blank" rel="noreferrer">
          tre-tu-ky-responsive
        </a>
      </div>

      <section className="page-config-layout">
        <aside className="section-list">
          <div className="section-list-heading">
            <strong>Cấu trúc trang chủ</strong>
            <small>{config.sections.filter((section) => section.enabled).length} khối đang hiển thị</small>
          </div>
          <nav aria-label="Các khối nội dung landing page">
            {config.sections.map((section, index) => (
              <button
                className={activeId === section.id ? "active" : ""}
                key={section.id}
                onClick={() => setActiveId(section.id)}
              >
                <span>{index === 0 ? <Icon name="settings" size={15} /> : String(index).padStart(2, "0")}</span>
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.enabled ? "Đang hiển thị" : "Đang ẩn"}</small>
                </span>
                <i className={section.enabled ? "visible" : ""} />
              </button>
            ))}
          </nav>
        </aside>

        <div className="config-editor">
          <div className="editor-heading">
            <div>
              <span>{activeSection.id === "general" ? "THÔNG TIN WEBSITE" : `KHỐI ${activeSection.label.toUpperCase()}`}</span>
              <h2>{activeSection.title}</h2>
              <p>{activeSection.id === "general" ? activeSection.description : "Chỉnh sửa nội dung đang hiển thị trên landing page."}</p>
            </div>
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
          <div className="mini-browser">
            <div className="browser-bar"><i /><i /><i /><span>cothuong.vn</span></div>
            <div className={`mini-section mini-section--${activeSection.id}`}>
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
                  {activeSection.items && (
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
    </>
  );
}

function GeneralSettings({
  config,
  onChange,
  onNavigationChange,
}: {
  config: typeof initialLandingPageConfig;
  onChange: (
    field: "siteName" | "shortName" | "logo" | "consultationLabel" | "phone" | "email" | "address",
    value: string,
  ) => void;
  onNavigationChange: (index: number, field: "label" | "path", value: string) => void;
}) {
  return (
    <div className="config-form">
      <div className="form-section">
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
      <div className="form-section">
        <div className="form-section-title">
          <strong>Thông tin liên hệ</strong>
          <p>Dùng cho biểu mẫu tư vấn và chân trang.</p>
        </div>
        <div className="form-grid">
          <label>Số điện thoại<input value={config.phone} onChange={(event) => onChange("phone", event.target.value)} /></label>
          <label>Email<input type="email" value={config.email} onChange={(event) => onChange("email", event.target.value)} /></label>
          <label className="field-wide">Địa chỉ<input value={config.address} onChange={(event) => onChange("address", event.target.value)} /></label>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">
          <strong>Điều hướng chính</strong>
          <p>Các liên kết xuất hiện trên thanh menu đầu trang.</p>
        </div>
        <div className="menu-config">
          {config.navigation.map((item, index) => (
            <div key={`${item.path}-${index}`}><span>{index + 1}</span><input value={item.label} onChange={(event) => onNavigationChange(index, "label", event.target.value)} /><input className="menu-path-input" value={item.path} onChange={(event) => onNavigationChange(index, "path", event.target.value)} /><button aria-label={`Tùy chọn ${item.label}`}><Icon name="more" size={16} /></button></div>
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
  onItemChange: (itemId: string, field: "title" | "description" | "meta", value: string) => void;
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
                  <label className="field-wide">Tiêu đề<input value={item.title} onChange={(event) => onItemChange(item.id, "title", event.target.value)} /></label>
                  {item.meta !== undefined && !/^\d+$/.test(item.meta) && <label className="field-wide">Nhãn phụ / vai trò<input value={item.meta} onChange={(event) => onItemChange(item.id, "meta", event.target.value)} /></label>}
                  {item.description !== undefined && <label className="field-wide">Mô tả<textarea value={item.description} onChange={(event) => onItemChange(item.id, "description", event.target.value)} /></label>}
                </div>
              </article>
            ))}
          </div>
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
  return (
    <label className="field-wide">
      {label}
      <span className="media-field">
        <span><Icon name="page" size={18} /></span>
        <span><strong>{value}</strong><small>JPG, PNG hoặc WEBP · Tối đa 5MB</small></span>
        <span className="media-upload">
          Thay ảnh
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && onChange) onChange(file.name);
            }}
          />
        </span>
      </span>
    </label>
  );
}
