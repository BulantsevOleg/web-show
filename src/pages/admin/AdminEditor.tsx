// src/pages/admin/AdminEditor.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../data/AdminContext";
import { useRegistry } from "../../data/RegistryProvider";
import {
  commitRegistry,
  getSignedUploadUrl,
  putFileToSignedUrl,
} from "../../services/adminApi";
import type { Registry, Item } from "../../types/registry";
import { slugify } from "../../utils/slug";

/** Безопасное глубокое клонирование */
function deepClone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

/** Установка значения по dotted-пути: "items.2.article.images.0" */
function setByPath(obj: any, dotted: string, val: unknown) {
  const parts = dotted.split(".");
  const last = parts.pop()!;
  const dst = parts.reduce((acc, key) => {
    if (acc[key] == null) acc[key] = {};
    return acc[key];
  }, obj);
  dst[last] = val;
}


/** Гарантируем длину массива (обрезаем/дополняем) */
function ensureLen<T>(arr: T[] | undefined, n: number, fill: T): T[] {
  const a = Array.isArray(arr) ? arr.slice() : [];
  while (a.length < n) a.push(fill);
  return a.slice(0, n);
}

export default function AdminEditor() {
  const navigate = useNavigate();
  const { token, logout } = useAdmin();
  const { data, etag, refresh, loading, urlUsed, error } = useRegistry();

  const [local, setLocal] = React.useState<Registry | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) setLocal(deepClone(data));
  }, [data]);

  if (!token) return <div className="p-6">Нет доступа. Перейдите на <b>/admin</b> и войдите.</div>;
  if (loading) return <div className="p-6">Загрузка…</div>;
  if (error) return <div className="p-6 text-red-600">Ошибка: {String(error)}</div>;
  if (!local) return <div className="p-6">Загрузка…</div>;

  const brands = Object.keys(local.brands);

  function addBrand(nameRaw: string) {
    const name = nameRaw.trim().toUpperCase();
    if (!name) return;
    setLocal((prev) => {
      if (!prev) return prev;
      if (prev.brands[name]) {
        alert("Такой бренд уже есть");
        return prev;
      }
      prev.brands[name] = {
        brandLogo: "",
        homeLogoBase: "",
        homeLogoHover: "",
        items: [],
      };
      return { ...prev };
    });
  }

  function deleteBrand(name: string) {
    if (!confirm(`Удалить бренд ${name}?`)) return;
    setLocal((prev) => {
      if (!prev) return prev;
      const copy = deepClone(prev);
      delete copy.brands[name];
      return copy;
    });
  }

  function addItem(brandKey: string, rawName: string) {
    const name = rawName.trim().toUpperCase();
    if (!name) return;

    setLocal((prev) => {
      if (!prev) return prev;
      const b = prev.brands[brandKey];
      const nextSlug = slugify(name);
      if (b.items.some((i) => (i.slug || slugify(i.name)) === nextSlug)) {
        alert("Айтем с таким именем уже есть");
        return { ...prev };
      }
      const it: Item = {
        name,
        slug: nextSlug,
        baseImage: "",
        hoverImage: "",
        article: {
          blocks: ["", "", "", "", "", "", ""],
          images: ["", "", "", "", "", "", ""],
          wbLink: "",
          tocBefore1: "",
          tocBefore2: "",
          tocBefore5: "",
          tocBefore6: "",
        },
      };      
      return {
        ...prev,
        brands: {
          ...prev.brands,
          [brandKey]: { ...b, items: [...b.items, it] },
        },
      };
    });
  }

  function deleteItem(brandKey: string, idx: number) {
    setLocal((prev) => {
      if (!prev) return prev;
      prev.brands[brandKey].items.splice(idx, 1);
      return { ...prev };
    });
  }

  function moveItem(brandKey: string, idx: number, dir: -1 | 1) {
    setLocal((prev) => {
      if (!prev) return prev;
      const items = prev.brands[brandKey].items;
      const j = idx + dir;
      if (j < 0 || j >= items.length) return prev;
  
      // создаём новый массив и меняем элементы местами
      const nextItems = items.slice();
      [nextItems[idx], nextItems[j]] = [nextItems[j], nextItems[idx]];
  
      return {
        ...prev,
        brands: {
          ...prev.brands,
          [brandKey]: {
            ...prev.brands[brandKey],
            items: nextItems,
          },
        },
      };
    });
  }

  /** Загрузка файла в бакет + запись относительного пути в локальный черновик */
  async function uploadImage(brandKey: string, fieldPath: string, file: File) {
    try {
      if (!token) throw new Error("Нет admin токена");
      const cleanName = file.name.replace(/\s+/g, "_");
      const path = `CONTENT/BRAND PAGE/${brandKey}/${cleanName}`;
      const contentType = file.type || "application/octet-stream";

      const { url, headers } = await getSignedUploadUrl(token, path, contentType);
      await putFileToSignedUrl(url, headers || { "Content-Type": contentType }, file);

      setLocal((prev) => {
        if (!prev) return prev;
        const copy = deepClone(prev);
        const brand = copy.brands[brandKey];
        setByPath(brand, fieldPath, path); // сохраняем относительный путь
        return copy;
      });

      alert("Изображение загружено");
    } catch (e: any) {
      alert("Ошибка загрузки: " + String(e?.message || e));
    }
  }

  /** Сохранение реестра в бакет с учётом ETag/локалки */
  async function saveAll() {
    if (!token || !local) return;
    setSaving(true);

     // клонируем и валидируем
    const nextJson: Registry = deepClone(local);
    const errors = validateDraft(nextJson);
    if (errors.length) {
        setSaving(false);
        // Покажем один общий тост и выделим поля (минимально — алертом списка)
        alert("Исправьте ошибки:\n" + errors.map(e => `• ${e.path}: ${e.message}`).join("\n"));
        return;
    }

    const bucketBase = (import.meta.env.VITE_BUCKET_BASE as string | undefined)?.trim() || "";
    const isS3 = !!(urlUsed && bucketBase && urlUsed.startsWith(bucketBase));

    try {
        await commitRegistry(token, {
          json: nextJson,
          expectedEtag: isS3 ? (etag || undefined) : undefined,
        });
        await refresh();
        alert("Сохранено");
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/etag_mismatch/i.test(msg) || /409/.test(msg)) {
          try {
            await refresh();
            const again = deepClone(nextJson); // сохраняем тот же исправленный драфт
            await commitRegistry(token, {
              json: again,
              expectedEtag: isS3 ? (etag || undefined) : undefined,
            });
            await refresh();
            alert("Сохранено (после обновления ETag)");
            return;
          } catch (e2: any) {
            alert(`Не удалось сохранить (после ретрая): ${e2.message || e2}`);
            return;
          }
        }
        alert(`Не удалось сохранить: ${msg}\nОбновите страницу и повторите.`);
      } finally {
        setSaving(false);
      }
    }

type DraftError = { path: string; message: string };

function validateDraft(reg: Registry): DraftError[] {
  const errs: DraftError[] = [];

  for (const [bk, b] of Object.entries(reg.brands)) {
    if (!bk.trim()) errs.push({ path: `brands.${bk}`, message: "Пустое имя бренда" });

    // проверка уникальности slug в рамках бренда
    const seen = new Set<string>();
    b.items.forEach((it, idx) => {
      const name = (it.name || "").trim();
      if (!name) errs.push({ path: `brands.${bk}.items.${idx}.name`, message: "Пустое имя айтема" });

      const slug = (it.slug || slugify(it.name)).trim();
      if (!slug) errs.push({ path: `brands.${bk}.items.${idx}.slug`, message: "Не удалось сформировать slug" });
      if (seen.has(slug)) errs.push({ path: `brands.${bk}.items.${idx}.slug`, message: "Дублирующийся slug в бренде" });
      seen.add(slug);

      // wbLink — если указан, должен начинаться с http/https
      const wb = it.article?.wbLink?.trim();
      if (wb && !/^https?:\/\//i.test(wb)) {
        errs.push({ path: `brands.${bk}.items.${idx}.article.wbLink`, message: "wbLink должен начинаться с http(s)://" });
      }

      // количество images/blocks нормализуем (не ошибка, просто подстрахуем)
      if (it.article) {
        if (!Array.isArray(it.article.images)) it.article.images = [];
        if (!Array.isArray(it.article.blocks)) it.article.blocks = [];
        if (it.article.images.length < 7) it.article.images.length = 7;
        if (it.article.blocks.length < 7) it.article.blocks.length = 7;
        for (let i = 0; i < 7; i++) {
          if (!it.article.images[i]) it.article.images[i] = "";
          if (!it.article.blocks[i]) it.article.blocks[i] = "";
        }
      }
    });
  }

  return errs;
}


  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl mr-auto">Админка</h1>
        <div className="text-xs opacity-70">ETag: {etag || "—"}</div>
        <button
          className="px-3 py-2 border border-black rounded-xl"
          onClick={saveAll}
          disabled={saving}
        >
          {saving ? "Сохраняю…" : "Сохранить"}
        </button>
        <button
          className="px-3 py-2 border border-black rounded-xl"
          onClick={() => {
            logout();
            navigate("/"); // возвращаем на главную после выхода
          }}
        >
          Выйти
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Бренды */}
        <div className="p-4 border border-black rounded-xl">
          <div className="text-sm mb-2">Бренды</div>
          <ul className="space-y-2">
            {brands.map((bk) => (
              <li key={bk} className="flex items-center justify-between">
                <div className="font-bold">{bk}</div>
                <div className="flex gap-3 items-center">
                  <label className="text-xs cursor-pointer underline">
                    Логотип бренда
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files && uploadImage(bk, "brandLogo", e.target.files[0])
                      }
                    />
                  </label>
                  <button className="text-xs opacity-70" onClick={() => deleteBrand(bk)}>
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <input
              id="newBrandName"
              className="border border-black rounded-xl px-3 py-2 text-sm flex-1"
              placeholder="Новый бренд"
            />
            <button
              className="px-3 py-2 border border-black rounded-xl"
              onClick={() => {
                const el = document.getElementById("newBrandName") as HTMLInputElement;
                addBrand(el.value);
                el.value = "";
              }}
            >
              Добавить
            </button>
          </div>
        </div>

        {/* Айтемы (по всем брендам простая форма) */}
        <div className="p-4 border border-black rounded-xl">
          <div className="text-sm mb-2">
            Айтемы <span className="opacity-60">(меняйте порядок стрелками)</span>
          </div>
          {brands.length === 0 ? (
            <div className="text-xs opacity-70">Добавьте бренд</div>
          ) : (
            brands.map((bk) => (
              <div key={bk} className="mb-6">
                <div className="font-bold mb-2">{bk}</div>
                {local.brands[bk].items.map((it, idx) => {
                  const stableKey = `${bk}:${it.slug || slugify(it.name)}`;
                  return (
                    <div key={stableKey} className="border border-black/20 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="border border-black rounded-xl px-2 py-1 text-sm flex-1"
                        value={it.name}
                        onChange={(e) =>
                          setLocal((prev) => {
                            if (!prev) return prev;
                            prev.brands[bk].items[idx].name = e.target.value;
                            prev.brands[bk].items[idx].slug = slugify(e.target.value);
                            return { ...prev };
                          })
                        }
                      />
                      {/* Кнопки порядка — ТОЛЬКО стрелки */}
                      <button
                        className="text-xs px-2 py-1 border rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => moveItem(bk, idx, -1)}
                        disabled={idx === 0}
                        aria-label="Поднять выше"
                        title="Поднять выше"
                      >
                        ↑
                      </button>
                      <button
                        className="text-xs px-2 py-1 border rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => moveItem(bk, idx, 1)}
                        disabled={idx === local.brands[bk].items.length - 1}
                        aria-label="Опустить ниже"
                        title="Опустить ниже"
                      >
                        ↓
                      </button>
                      <button
                        className="text-xs px-2 py-1 border rounded-xl opacity-70"
                        onClick={() => deleteItem(bk, idx)}
                      >
                        Удалить
                      </button>
                    </div>
                  
                  {/* base/hover изображения карточки — без изменений */}
                  <div className="flex items-center gap-3 mt-2">
                    <label className="text-xs underline cursor-pointer">
                      Base image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files &&
                          uploadImage(bk, `items.${idx}.baseImage`, e.target.files[0])
                        }
                      />
                    </label>
                    <span className="text-[11px] opacity-70 break-all">
                      {it.baseImage || "не задано"}
                    </span>
                  </div>
              
                  <div className="flex items-center gap-3 mt-1">
                    <label className="text-xs underline cursor-pointer">
                      Hover image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files &&
                          uploadImage(bk, `items.${idx}.hoverImage`, e.target.files[0])
                        }
                      />
                    </label>
                    <span className="text-[11px] opacity-70 break-all">
                      {it.hoverImage || "не задано"}
                    </span>
                  </div>
                    <div className="mt-3">
                    <div className="text-xs mb-2 opacity-70">Фотографии статьи (до 7)</div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => {
                        const path = it.article?.images?.[i] || "";
                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                            <div className="h-12 w-12 rounded bg-neutral-100 overflow-hidden border">
                                {path ? (
                                <img src={path} alt={`img${i+1}`} className="h-full w-full object-cover" />
                                ) : (
                                <div className="h-full w-full grid place-items-center text-[10px] opacity-40">—</div>
                                )}
                            </div>
                            <label className="text-[10px] underline cursor-pointer">
                                Загрузить
                                <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    e.target.files &&
                                    uploadImage(bk, `items.${idx}.article.images.${i}`, e.target.files[0])
                                }
                                />
                            </label>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                    {/* Фото статьи (до 7) */}
                    {/* ===== РЕДАКТОР СТАТЬИ (WB, подзаголовки, тексты, 7 фото) ===== */}
                    {(() => {
                      const a = it.article ?? {
                        blocks: [],
                        images: [],
                        wbLink: "",
                        tocBefore2: "",
                        tocBefore6: "",
                      };
                      const blocks = ensureLen(a.blocks, 7, "");
                      const images = ensureLen(a.images, 7, "");

                      return (
                        <div className="mt-3 border-t border-black/10 pt-3">
                          {/* WB и подзаголовки */}
                          <div className="grid md:grid-cols-3 gap-3">
                            <label className="text-xs">
                              WB ссылка
                              <input
                                className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                placeholder="https://..."
                                value={a.wbLink || ""}
                                onChange={(e) =>
                                  setLocal((prev) => {
                                    if (!prev) return prev;
                                    const art =
                                      (prev.brands[bk].items[idx].article =
                                        prev.brands[bk].items[idx].article || {
                                          blocks: [],
                                          images: [],
                                        });
                                    art.wbLink = e.target.value.trim();
                                    return { ...prev };
                                  })
                                }
                              />
                            </label>
                            <label className="text-xs">
                              Подзаголовок перед блоком 1
                              <input
                                className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                value={a.tocBefore1 || ""}
                                onChange={(e) =>
                                  setLocal((prev) => {
                                    if (!prev) return prev;
                                    const art =
                                      (prev.brands[bk].items[idx].article =
                                        prev.brands[bk].items[idx].article || {
                                          blocks: [],
                                          images: [],
                                        });
                                    art.tocBefore1 = e.target.value;
                                    return { ...prev };
                                  })
                                }
                              />
                            </label>
                            <label className="text-xs">
                              Подзаголовок перед блоком 2
                              <input
                                className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                value={a.tocBefore2 || ""}
                                onChange={(e) =>
                                  setLocal((prev) => {
                                    if (!prev) return prev;
                                    const art =
                                      (prev.brands[bk].items[idx].article =
                                        prev.brands[bk].items[idx].article || {
                                          blocks: [],
                                          images: [],
                                        });
                                    art.tocBefore2 = e.target.value;
                                    return { ...prev };
                                  })
                                }
                              />
                            </label>
                            <label className="text-xs">
                              Подзаголовок перед блоком 4
                              <input
                                className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                value={a.tocBefore5 || ""}
                                onChange={(e) =>
                                  setLocal((prev) => {
                                    if (!prev) return prev;
                                    const art =
                                      (prev.brands[bk].items[idx].article =
                                        prev.brands[bk].items[idx].article || {
                                          blocks: [],
                                          images: [],
                                        });
                                    art.tocBefore5 = e.target.value;
                                    return { ...prev };
                                  })
                                }
                              />
                            </label>
                            <label className="text-xs">
                              Подзаголовок перед блоком 5
                              <input
                                className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                value={a.tocBefore6 || ""}
                                onChange={(e) =>
                                  setLocal((prev) => {
                                    if (!prev) return prev;
                                    const art =
                                      (prev.brands[bk].items[idx].article =
                                        prev.brands[bk].items[idx].article || {
                                          blocks: [],
                                          images: [],
                                        });
                                    art.tocBefore6 = e.target.value;
                                    return { ...prev };
                                  })
                                }
                              />
                            </label>
                          </div>

                          {/* Текстовые блоки 0..6 */}
                          <div className="mt-3 grid md:grid-cols-2 gap-3">
                            {blocks.map((val, bi) => (
                              <label key={bi} className="text-xs">
                                Текст {bi + 1}
                                <textarea
                                  rows={3}
                                  className="mt-1 w-full border rounded-xl px-2 py-1 text-sm"
                                  value={val}
                                  onChange={(e) =>
                                    setLocal((prev) => {
                                      if (!prev) return prev;
                                      const art =
                                        (prev.brands[bk].items[idx].article =
                                          prev.brands[bk].items[idx].article || {
                                            blocks: [],
                                            images: [],
                                          });
                                      const next = ensureLen(art.blocks, 7, "");
                                      next[bi] = e.target.value;
                                      art.blocks = next;
                                      return { ...prev };
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </div>

                          {/* Фото 0..6 */}
                          {/* убрал лишние фото */}
                          {/* <div className="mt-3 grid md:grid-cols-2 gap-3">
                            {images.map((path, ii) => (
                              <div key={ii} className="text-xs border rounded-xl p-2">
                                <div className="mb-1 font-medium">Фото {ii + 1}</div>
                                <div className="flex items-center gap-3">
                                  <label className="underline cursor-pointer">
                                    Загрузить
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        e.target.files &&
                                        uploadImage(
                                          bk,
                                          `items.${idx}.article.images.${ii}`,
                                          e.target.files[0]
                                        )
                                      }
                                    />
                                  </label>
                                  <span className="text-[11px] opacity-70 break-all">
                                    {path || "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div> */}

                          {/* Превью айтема */}
                          <div className="mt-3">
                            <a
                              className="text-xs underline"
                              href={`#/catalog/${encodeURIComponent(bk)}/${encodeURIComponent(
                                (it.slug || "").toUpperCase() || encodeURIComponent(it.name)
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Открыть превью айтема
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  );
                })}

                <div className="flex gap-2">
                  <input
                    id={`newItem-${bk}`}
                    className="border border-black rounded-xl px-3 py-2 text-sm flex-1"
                    placeholder="Новый айтем"
                  />
                  <button
                    className="px-3 py-2 border border-black rounded-xl"
                    onClick={() => {
                      const el = document.getElementById(
                        `newItem-${bk}`
                      ) as HTMLInputElement;
                      addItem(bk, el.value);
                      el.value = "";
                    }}
                  >
                    Добавить айтем
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// import React from "react";
// import { useAdmin } from "../../data/AdminContext";
// import { useRegistry } from "../../data/RegistryProvider";
// import {
//   commitRegistry,
//   getSignedUploadUrl,
//   putFileToSignedUrl,
// } from "../../services/adminApi";

// import type { Registry, Item } from "../../types/registry";
// import { slugify } from "../../utils/slug";
// import { useNavigate } from "react-router-dom";


// /** утилита: безопасно клонируем объект */
// function deepClone<T>(v: T): T {
//   return typeof structuredClone === "function"
//     ? structuredClone(v)
//     : JSON.parse(JSON.stringify(v));
// }

// /** утилита: проставить значение по dotted-пути, например "items.2.baseImage" */
// function setByPath(obj: any, dotted: string, val: unknown) {
//   const parts = dotted.split(".");
//   const last = parts.pop()!;
//   const dst = parts.reduce((acc, key) => {
//     if (acc[key] == null) acc[key] = {};
//     return acc[key];
//   }, obj);
//   dst[last] = val;
// }

// export default function AdminEditor() {
//   const navigate = useNavigate();
//   const { token, logout } = useAdmin();
//   const { data, etag, refresh, loading, urlUsed, error } = useRegistry();

//   const [local, setLocal] = React.useState<Registry | null>(null);
//   const [saving, setSaving] = React.useState(false);

//   React.useEffect(() => {
//     if (data) setLocal(deepClone(data));
//   }, [data]);

// //   if (!token) return <div className="p-6">Нет доступа. Перейдите на <b>/admin</b> и войдите.</div>;
//   if (loading) return <div className="p-6">Загрузка…</div>;
//   if (error) return <div className="p-6 text-red-600">Ошибка: {String(error)}</div>;
//   if (!local) return <div className="p-6">Загрузка…</div>;

//   const brands = Object.keys(local.brands);

//   function addBrand(name: string) {
//     if (!name) return;
//     setLocal((prev) => {
//       if (!prev) return prev;
//       if (prev.brands[name]) {
//         alert("Такой бренд уже есть");
//         return prev;
//       }
//       prev.brands[name] = {
//         brandLogo: "",
//         homeLogoBase: "",
//         homeLogoHover: "",
//         items: [],
//       };
//       return { ...prev };
//     });
//   }

//   function deleteBrand(name: string) {
//     if (!confirm(`Удалить бренд ${name}?`)) return;
//     setLocal((prev) => {
//       if (!prev) return prev;
//       const copy = deepClone(prev);
//       delete copy.brands[name];
//       return copy;
//     });
//   }

//   function addItem(brandKey: string, rawName: string) {
//     const name = rawName.trim().toUpperCase();
//     if (!name) return;
  
//     setLocal(prev => {
//       if (!prev) return prev;
//       const b = prev.brands[brandKey];
//       const nextSlug = slugify(name);
  
//       if (b.items.some(i => (i.slug || slugify(i.name)) === nextSlug)) {
//         alert("Айтем с таким именем уже есть");
//         return { ...prev };
//       }
  
//       const it: Item = {
//         name,
//         slug: nextSlug,
//         baseImage: "",
//         hoverImage: "",
//         article: {
//           blocks: ["", "", "", "", "", "", ""],
//           images: ["", "", "", "", "", "", ""],
//           wbLink: "",
//           tocBefore2: "",
//           tocBefore6: "",
//         },
//       };
  
//       return {
//         ...prev,
//         brands: {
//           ...prev.brands,
//           [brandKey]: { ...b, items: [...b.items, it] },
//         },
//       };
//     });
//   }
  
  

//   function deleteItem(brandKey: string, idx: number) {
//     setLocal((prev) => {
//       if (!prev) return prev;
//       prev.brands[brandKey].items.splice(idx, 1);
//       return { ...prev };
//     });
//   }

//   function moveItem(brandKey: string, idx: number, dir: -1 | 1) {
//     setLocal((prev) => {
//       if (!prev) return prev;
//       const arr = prev.brands[brandKey].items;
//       const j = idx + dir;
//       if (j < 0 || j >= arr.length) return prev;
//       [arr[idx], arr[j]] = [arr[j], arr[idx]];
//       return { ...prev };
//     });
//   }

//   /** Загрузка файла в бакет + запись относительного пути в локальный реестр */
//   async function uploadImage(brandKey: string, fieldPath: string, file: File) {
//     try {
//       if (!token) throw new Error("Нет admin токена");

//       // Генерируем понятный путь в бакете (можно ужесточить правила при желании)
//       const cleanName = file.name.replace(/\s+/g, "_");
//       const path = `CONTENT/BRAND PAGE/${brandKey}/${cleanName}`;
//       const contentType = file.type || "application/octet-stream";

//       // 1) Получаем подписанный URL
//       const { url, headers } = await getSignedUploadUrl(token, path, contentType);

//       // 2) Кладём файл по подписанному URL (ТОЛЬКО те хедеры, что вернул sign)
//       await putFileToSignedUrl(url, headers || { "Content-Type": contentType }, file);

//       // 3) Обновляем локальный черновик — сохраняем относительный путь
//       setLocal((prev) => {
//         if (!prev) return prev;
//         const copy = deepClone(prev);
//         const brand = copy.brands[brandKey];
//         setByPath(brand, fieldPath, path);
//         return copy;
//       });

//       alert("Изображение загружено");
//     } catch (e: any) {
//       alert("Ошибка загрузки: " + String(e?.message || e));
//     }
//   }

//   async function saveAll() {
//     if (!token || !local) return;
//     setSaving(true);

//     // читаем из S3?
//     const bucketBase = (import.meta.env.VITE_BUCKET_BASE as string | undefined)?.trim() || "";
//     const isS3 = !!(urlUsed && bucketBase && urlUsed.startsWith(bucketBase));

//     try {
//       const nextJson: Registry = JSON.parse(JSON.stringify(local));
//       await commitRegistry(token, {
//         json: nextJson,
//         expectedEtag: isS3 ? (etag || undefined) : undefined, // локально — без ETag
//       });
//       await refresh();
//       alert("Сохранено");
//     } catch (e: any) {
//       const msg = String(e?.message || e);
//       if (/etag_mismatch/i.test(msg) || /409/.test(msg)) {
//         try {
//           await refresh(); // подтянуть текущий S3-ETag
//           const again: Registry = JSON.parse(JSON.stringify(local));
//           await commitRegistry(token, {
//             json: again,
//             expectedEtag: isS3 ? (etag || undefined) : undefined,
//           });
//           await refresh();
//           alert("Сохранено (после обновления ETag)");
//           return;
//         } catch (e2: any) {
//           alert(`Не удалось сохранить (после ретрая): ${e2.message || e2}`);
//           return;
//         }
//       }
//       alert(`Не удалось сохранить: ${msg}\nОбновите страницу и повторите.`);
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center gap-3 mb-4">
//         <h1 className="text-xl mr-auto">Админка</h1>
//         <div className="text-xs opacity-70 mr-3">ETag: {etag || "—"}</div>
//         <button
//           className="px-3 py-2 border border-black rounded-xl"
//           onClick={saveAll}
//           disabled={saving}
//         >
//           {saving ? "Сохраняю…" : "Сохранить"}
//         </button>
//         <button
//             className="px-3 py-2 border border-black rounded-xl"
//             onClick={() => { 
//                 logout();
//                 navigate("/", { replace: true }); // уводим на главную
//             }}
//             >
//             Выйти
//         </button>
//       </div>

//       <div className="grid md:grid-cols-2 gap-6">
//         {/* Бренды */}
//         <div className="p-4 border border-black rounded-xl">
//           <div className="text-sm mb-2">Бренды</div>
//           <ul className="space-y-2">
//             {brands.map((bk) => (
//               <li key={bk} className="flex items-center justify-between">
//                 <div className="font-bold">{bk}</div>
//                 <div className="flex gap-3 items-center">
//                   <label className="text-xs cursor-pointer underline">
//                     Логотип бренда
//                     <input
//                       type="file"
//                       accept="image/*"
//                       className="hidden"
//                       onChange={(e) =>
//                         e.target.files && uploadImage(bk, "brandLogo", e.target.files[0])
//                       }
//                     />
//                   </label>
//                   <button className="text-xs opacity-70" onClick={() => deleteBrand(bk)}>
//                     Удалить
//                   </button>
//                 </div>
//               </li>
//             ))}
//           </ul>

//           <div className="mt-3 flex gap-2">
//             <input
//               id="newBrandName"
//               className="border border-black rounded-xl px-3 py-2 text-sm flex-1"
//               placeholder="Новый бренд"
//             />
//             <button
//               className="px-3 py-2 border border-black rounded-xl"
//               onClick={() => {
//                 const el = document.getElementById("newBrandName") as HTMLInputElement;
//                 addBrand(el.value.trim().toUpperCase());
//                 el.value = "";
//               }}
//             >
//               Добавить
//             </button>
//           </div>
//         </div>

//         {/* Айтемы (по всем брендам простая форма) */}
//         <div className="p-4 border border-black rounded-xl">
//           <div className="text-sm mb-2">Айтемы</div>
//           {brands.length === 0 ? (
//             <div className="text-xs opacity-70">Добавьте бренд</div>
//           ) : (
//             brands.map((bk) => (
//               <div key={bk} className="mb-6">
//                 <div className="font-bold mb-2">{bk}</div>

//                 {local.brands[bk].items.map((it, idx) => (
//                   <div key={bk + idx} className="border border-black/20 rounded-xl p-3 mb-2">
//                     <div className="flex items-center gap-2">
//                       <input
//                         className="border border-black rounded-xl px-2 py-1 text-sm flex-1"
//                         value={it.name}
//                         onChange={(e) =>
//                           setLocal((prev) => {
//                             if (!prev) return prev;
//                             prev.brands[bk].items[idx].name = e.target.value;
//                             prev.brands[bk].items[idx].slug = slugify(e.target.value);
//                             return { ...prev };
//                           })
//                         }
//                       />
//                       <button
//                         className="text-xs px-2 py-1 border rounded-xl"
//                         onClick={() => moveItem(bk, idx, -1)}
//                       >
//                         ↑
//                       </button>
//                       <button
//                         className="text-xs px-2 py-1 border rounded-xl"
//                         onClick={() => moveItem(bk, idx, 1)}
//                       >
//                         ↓
//                       </button>
//                       <button
//                         className="text-xs px-2 py-1 border rounded-xl opacity-70"
//                         onClick={() => deleteItem(bk, idx)}
//                       >
//                         Удалить
//                       </button>
//                     </div>

//                     <div className="flex items-center gap-3 mt-2">
//                       <label className="text-xs underline cursor-pointer">
//                         Base image
//                         <input
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           onChange={(e) =>
//                             e.target.files &&
//                             uploadImage(bk, `items.${idx}.baseImage`, e.target.files[0])
//                           }
//                         />
//                       </label>
//                       <span className="text-[11px] opacity-70">
//                         {it.baseImage || "не задано"}
//                       </span>
//                     </div>

//                     <div className="flex items-center gap-3 mt-1">
//                       <label className="text-xs underline cursor-pointer">
//                         Hover image
//                         <input
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           onChange={(e) =>
//                             e.target.files &&
//                             uploadImage(bk, `items.${idx}.hoverImage`, e.target.files[0])
//                           }
//                         />
//                       </label>
//                       <span className="text-[11px] opacity-70">
//                         {it.hoverImage || "не задано"}
//                       </span>
//                     </div>
//                   </div>
//                 ))}

//                 <div className="flex gap-2">
//                   <input
//                     id={`newItem-${bk}`}
//                     className="border border-black rounded-xl px-3 py-2 text-sm flex-1"
//                     placeholder="Новый айтем"
//                   />
//                   <button
//                     className="px-3 py-2 border border-black rounded-xl"
//                     onClick={() => {
//                       const el = document.getElementById(
//                         `newItem-${bk}`
//                       ) as HTMLInputElement;
//                       addItem(bk, el.value.trim().toUpperCase());
//                       el.value = "";
//                     }}
//                   >
//                     Добавить айтем
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // import React from "react";
// // import { useAdmin } from "../../data/AdminContext";
// // import { useRegistry } from "../../data/RegistryProvider";
// // import { commitRegistry, getSignedUploadUrl, putFileToSignedUrl } from "../../services/adminApi";


// // import type { Registry, Brand, Item } from "../../types/registry";
// // import { slugify } from "../../utils/slug"; 

// // export default function AdminEditor() {
// //   const { token, logout } = useAdmin();
// //   const { data, etag, refresh, loading, error } = useRegistry();

// //   const [local, setLocal] = React.useState<Registry | null>(null);
// //   const [saving, setSaving] = React.useState(false);

// //   React.useEffect(() => {
// //     if (data) setLocal(JSON.parse(JSON.stringify(data)));
// //   }, [data]);

// //   if (!token) return <div className="p-6">Нет доступа. Перейдите на /admin и войдите.</div>;
// //   if (!local) return <div className="p-6">Загрузка…</div>;

// //   const brands = Object.keys(local.brands);

// //   function addBrand(name: string) {
// //     if (!name) return;
// //     setLocal((prev) => {
// //       if (!prev) return prev;
// //       if (prev.brands[name]) { alert("Такой бренд уже есть"); return prev; }
// //       prev.brands[name] = { brandLogo: "", homeLogoBase: "", homeLogoHover: "", items: [] };
// //       return { ...prev };
// //     });
// //   }
// //   async function onSave(json: any) {
// //     try {
// //       if (!token) throw new Error("Нет admin токена");
// //       const resp = await commitRegistry(token, {
// //         json,
// //         expectedEtag: etag || undefined, // чтобы не перетёрли чужие изменения
// //       });
// //       // (опционально) можешь сохранить новый etag: resp.etag
// //       await refresh();                   // перечитать свежий реестр и etag
// //       alert("Сохранено");
// //     } catch (e: any) {
// //       alert("Не удалось сохранить: " + String(e?.message || e) + "\nПопробуйте обновить страницу.");
// //     }
// //   }

// //   function deleteBrand(name: string) {
// //     if (!confirm(`Удалить бренд ${name}?`)) return;
// //     setLocal((prev) => {
// //       if (!prev) return prev;
// //       const copy = JSON.parse(JSON.stringify(prev)) as Registry;
// //       delete copy.brands[name];
// //       return copy;
// //     });
// //   }

// //   function addItem(brandKey: string, itemName: string) {
// //     if (!itemName) return;
// //     setLocal((prev) => {
// //       if (!prev) return prev;
// //       const b = prev.brands[brandKey];
// //       const it: Item = {
// //         name: itemName,
// //         slug: slugify(itemName),
// //         baseImage: "",
// //         hoverImage: "",
// //         article: { blocks: ["","","","","","",""], images: ["","","","","","",""], wbLink: "", tocBefore2: "", tocBefore6: "" }
// //       };
// //       b.items.push(it);
// //       return { ...prev };
// //     });
// //   }

// //   function deleteItem(brandKey: string, idx: number) {
// //     setLocal((prev) => {
// //       if (!prev) return prev;
// //       prev.brands[brandKey].items.splice(idx, 1);
// //       return { ...prev };
// //     });
// //   }

// //   function moveItem(brandKey: string, idx: number, dir: -1 | 1) {
// //     setLocal((prev) => {
// //       if (!prev) return prev;
// //       const arr = prev.brands[brandKey].items;
// //       const j = idx + dir;
// //       if (j < 0 || j >= arr.length) return prev;
// //       [arr[idx], arr[j]] = [arr[j], arr[idx]];
// //       return { ...prev };
// //     });
// //   }

// //   async function onPickImage(file: File, targetKey: string, contentTypeFallback = "application/octet-stream") {
// //     try {
// //       if (!token) throw new Error("Нет admin токена");
// //       const contentType = file.type || contentTypeFallback;
  
// //       // 1) запросили URL
// //       const { url, headers, key } = await getSignedUploadUrl(token, targetKey, contentType);
  
// //       // 2) PUT в бакет
// //       await putFileToSignedUrl(url, headers || { "Content-Type": contentType }, file);
  
// //       // 3) сохраняем относительный путь в реестре (key или targetKey)
// //       applyToDraft((draft) => {
// //         // пример: draft.brands[brandKey].items[itemIndex].baseImage = key ?? targetKey;
// //         // скорректируй под свою структуру стейта в редакторе
// //       });
  
// //       // 4) подсказка/уведомление
// //       alert("Изображение загружено");
// //     } catch (e: any) {
// //       alert("Ошибка загрузки: " + String(e?.message || e));
// //     }
// //   }

// //   async function uploadImage(brandKey: string, fieldPath: string, file: File) {
// //     // fieldPath: "brandLogo" | "homeLogoBase" | `items.${i}.baseImage` и т.п.
// //     // Пример авто-пути:
// //     const cleanName = file.name.replace(/\s+/g, "_");
// //     const path = `CONTENT/BRAND PAGE/${brandKey}/${cleanName}`;
// //     try {
// //       const signed = await getSignedUploadUrl({ path, contentType: file.type || "application/octet-stream", token: token! });
// //       await putFileToSignedUrl(signed, file);
// //       // записываем относительный путь в модель
// //       setLocal((prev) => {
// //         if (!prev) return prev;
// //         const b = prev.brands[brandKey];
// //         const assign = (obj: any, dotted: string, val: string) => {
// //           const parts = dotted.split(".");
// //           const last = parts.pop()!;
// //           const dst = parts.reduce((o, k) => o[k], obj);
// //           dst[last] = path; // сохраняем относительный путь
// //         };
// //         assign(b, fieldPath, path);
// //         return { ...prev };
// //       });
// //     } catch (e: any) {
// //       alert(`Ошибка загрузки: ${e.message || e}`);
// //     }
// //   }

// //   async function saveAll() {
// //     if (!token) return;
// //     setSaving(true);
// //     try {
// //       const res = await commitRegistry(token, { json: nextJson, expectedEtag: etag || undefined });
// //       // опционально: можно сохранить новый etag из ответа res.etag
// //       await refresh();
// //       alert("Сохранено");
        
// //       await refresh(); // подтянуть свежие данные + новый etag
// //     } catch (e: any) {
// //       alert(`Не удалось сохранить: ${e.message || e}. Попробуйте обновить страницу и повторить.`);
// //     } finally {
// //       setSaving(false);
// //     }
// //   }

// //   return (
// //     <div className="p-6">
// //       <div className="flex items-center gap-3 mb-4">
// //         <h1 className="text-xl mr-auto">Админка</h1>
// //         <button className="px-3 py-2 border border-black rounded-xl" onClick={() => saveAll()} disabled={saving}>
// //           {saving ? "Сохраняю…" : "Сохранить"}
// //         </button>
// //         <button className="px-3 py-2 border border-black rounded-xl" onClick={logout}>Выйти</button>
// //       </div>

// //       <div className="mb-6 text-xs opacity-70">Текущий ETag: {etag || "—"}</div>

// //       <div className="grid md:grid-cols-2 gap-6">
// //         {/* Список брендов */}
// //         <div className="p-4 border border-black rounded-xl">
// //           <div className="text-sm mb-2">Бренды</div>
// //           <ul className="space-y-2">
// //             {brands.map((bk) => (
// //               <li key={bk} className="flex items-center justify-between">
// //                 <div className="font-bold">{bk}</div>
// //                 <div className="flex gap-2">
// //                   <label className="text-xs cursor-pointer underline">
// //                     Логотип бренда
// //                     <input
// //                       type="file"
// //                       accept="image/*"
// //                       className="hidden"
// //                       onChange={(e) => e.target.files && uploadImage(bk, "brandLogo", e.target.files[0])}
// //                     />
// //                   </label>
// //                   <button className="text-xs opacity-70" onClick={() => deleteBrand(bk)}>Удалить</button>
// //                 </div>
// //               </li>
// //             ))}
// //           </ul>

// //           <div className="mt-3 flex gap-2">
// //             <input id="newBrandName" className="border border-black rounded-xl px-3 py-2 text-sm flex-1" placeholder="Новый бренд"/>
// //             <button
// //               className="px-3 py-2 border border-black rounded-xl"
// //               onClick={() => {
// //                 const el = document.getElementById("newBrandName") as HTMLInputElement;
// //                 addBrand(el.value.trim().toUpperCase());
// //                 el.value = "";
// //               }}
// //             >
// //               Добавить
// //             </button>
// //           </div>
// //         </div>

// //         {/* Айтемы выбранного бренда — для простоты по одному (первому) бренду */}
// //         <div className="p-4 border border-black rounded-xl">
// //           <div className="text-sm mb-2">Айтемы</div>
// //           {brands.length === 0 ? (
// //             <div className="text-xs opacity-70">Добавьте бренд</div>
// //           ) : (
// //             brands.map((bk) => (
// //               <div key={bk} className="mb-6">
// //                 <div className="font-bold mb-2">{bk}</div>
// //                 {local.brands[bk].items.map((it, idx) => (
// //                   <div key={bk + idx} className="border border-black/20 rounded-xl p-3 mb-2">
// //                     <div className="flex items-center gap-2">
// //                       <input
// //                         className="border border-black rounded-xl px-2 py-1 text-sm flex-1"
// //                         value={it.name}
// //                         onChange={(e) =>
// //                           setLocal(prev => {
// //                             if (!prev) return prev;
// //                             prev.brands[bk].items[idx].name = e.target.value;
// //                             prev.brands[bk].items[idx].slug = slugify(e.target.value);
// //                             return { ...prev };
// //                           })
// //                         }
// //                       />
// //                       <button className="text-xs px-2 py-1 border rounded-xl" onClick={() => moveItem(bk, idx, -1)}>↑</button>
// //                       <button className="text-xs px-2 py-1 border rounded-xl" onClick={() => moveItem(bk, idx,  1)}>↓</button>
// //                       <button className="text-xs px-2 py-1 border rounded-xl opacity-70" onClick={() => deleteItem(bk, idx)}>Удалить</button>
// //                     </div>

// //                     <div className="flex items-center gap-3 mt-2">
// //                       <label className="text-xs underline cursor-pointer">
// //                         Base image
// //                         <input type="file" accept="image/*" className="hidden"
// //                           onChange={(e) => e.target.files && uploadImage(bk, `items.${idx}.baseImage`, e.target.files[0])}/>
// //                       </label>
// //                       <span className="text-[11px] opacity-70">{it.baseImage || "не задано"}</span>
// //                     </div>

// //                     <div className="flex items-center gap-3 mt-1">
// //                       <label className="text-xs underline cursor-pointer">
// //                         Hover image
// //                         <input type="file" accept="image/*" className="hidden"
// //                           onChange={(e) => e.target.files && uploadImage(bk, `items.${idx}.hoverImage`, e.target.files[0])}/>
// //                       </label>
// //                       <span className="text-[11px] opacity-70">{it.hoverImage || "не задано"}</span>
// //                     </div>
// //                   </div>
// //                 ))}

// //                 <div className="flex gap-2">
// //                   <input id={`newItem-${bk}`} className="border border-black rounded-xl px-3 py-2 text-sm flex-1" placeholder="Новый айтем"/>
// //                   <button
// //                     className="px-3 py-2 border border-black rounded-xl"
// //                     onClick={() => {
// //                       const el = document.getElementById(`newItem-${bk}`) as HTMLInputElement;
// //                       addItem(bk, el.value.trim().toUpperCase());
// //                       el.value = "";
// //                     }}
// //                   >
// //                     Добавить айтем
// //                   </button>
// //                 </div>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
