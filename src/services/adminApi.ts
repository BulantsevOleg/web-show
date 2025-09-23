// src/services/adminApi.ts
type SignUploadResponse = {
    url: string;                           // подписанный PUT URL
    headers?: Record<string, string>;      // какие заголовки обязательно передать при PUT
    key?: string;                          // ключ (путь) объекта, можно сохранить в registry.json
  };
  
  type CommitRequest = {
    json: unknown;                         // новый registry.json (JS-объект)
    expectedEtag?: string;                 // ETag, который мы читали (для optimistic lock)
  };
  
  type CommitResponse = {
    ok?: boolean;
    etag?: string | null;
    versionId?: string | null;
    error?: string;
    detail?: string;
  };
  
  const SIGN_URL   = import.meta.env.VITE_SIGN_URL!;
  const COMMIT_URL = import.meta.env.VITE_COMMIT_URL!;
  const BUCKET_BASE = import.meta.env.VITE_BUCKET_BASE!; // на случай предпросмотра
  const REGISTRY_URL = import.meta.env.VITE_REGISTRY_URL!; // на случай предпросмотра
  
  function assertEnv() {
    if (!SIGN_URL || !COMMIT_URL || !BUCKET_BASE || !REGISTRY_URL) {
      throw new Error("ENV отсутствуют: VITE_SIGN_URL / VITE_COMMIT_URL / VITE_BUCKET_BASE / REGISTRY_URL");
    }
  }
  
  /** Проверяем токен (простейший “ping”) — можно дернуть sign без body */
  export async function adminLogin(token: string): Promise<string> {
    assertEnv();
    const res = await fetch(SIGN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({ path: "CONTENT/.ping.txt", contentType: "text/plain" }),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.dispatchEvent(new CustomEvent("admin:unauthorized"));
        }
        throw new Error(`HTTP ${res.status}`);
    }
    // если всё ок — возвращаем исходный токен, будем хранить его
    return token;
  }
  
  /** Запросить подписанный URL для PUT */
  export async function getSignedUploadUrl(
    token: string,
    path: string,            // например: "CONTENT/BRAND PAGE/MEAF/ZIPSNOW.jpg"
    contentType: string      // например: "image/jpeg"
  ): Promise<SignUploadResponse> {
    assertEnv();
    const res = await fetch(SIGN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({ path, contentType }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`sign-upload HTTP ${res.status} ${t}`);
    }
    const json = (await res.json()) as SignUploadResponse;
    if (!json.url) throw new Error("sign-upload: нет url в ответе");
    return json;
  }
  
  /** Положить файл по подписанному URL — ВАЖНО: только те заголовки, что вернул sign */
  export async function putFileToSignedUrl(
    signedUrl: string,
    headersFromSign: Record<string, string> | undefined,
    file: File | Blob
  ): Promise<void> {
    const headers = new Headers();
    // переносим только разрешённые хедеры из функции — чаще всего это "Content-Type"
    if (headersFromSign) {
      for (const [k, v] of Object.entries(headersFromSign)) headers.set(k, v);
    }
    const res = await fetch(signedUrl, {
      method: "PUT",
      mode: "cors",
      headers,
      body: file,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`PUT signed URL HTTP ${res.status} ${t}`);
    }
  }
  
  /** Коммитим новый registry.json в бакет (optimistic lock через ETag) */
  export async function commitRegistry(
    token: string,
    payload: CommitRequest
  ): Promise<CommitResponse> {
    assertEnv();
    const res = await fetch(import.meta.env.VITE_COMMIT_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(payload),
    });
    // функция на вашей стороне уже настроена — отдаёт { ok, etag, versionId } или {error}
    const json = (await res.json().catch(() => ({}))) as CommitResponse;
    if (!res.ok || json.error) {
      throw new Error(
        `commit-registry HTTP ${res.status} ${json.error ? `— ${json.error}` : ""} ${json.detail ? `(${json.detail})` : ""}`
      );
    }
    return json;
  }
  
  /** Удобный helper для сборки “полного” URL (предпросмотр в UI), если в реестре лежат относительные пути */
  export function resolveBucketUrl(rel: string): string {
    if (/^https?:\/\//i.test(rel)) return rel;
    const base = BUCKET_BASE.replace(/\/+$/, "");
    const key = rel.replace(/^\/+/, "");
    return `${base}/${encodeURI(key)}`;
  }
  
// export async function adminLogin(token: string) {
//     // Условная проверка — на сервере нет real auth, поэтому просто проверяем длину
//     if (!token || token.length < 20) throw new Error("Некорректный токен");
//     return token;
//   }
  
//   const SIGN_URL = import.meta.env.VITE_SIGN_URL as string;
//   const COMMIT_URL = import.meta.env.VITE_COMMIT_URL as string;
  
//   export async function getSignedUploadUrl(opts: { path: string; contentType: string; token: string }) {
//     const res = await fetch(SIGN_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-admin-token": opts.token,
//       },
//       body: JSON.stringify({ path: opts.path, contentType: opts.contentType }),
//     });
//     if (!res.ok) throw new Error(`sign-upload HTTP ${res.status}`);
//     return (await res.json()) as { url: string; headers: Record<string, string> };
//   }
  
//   export async function putFileToSignedUrl(signed: { url: string; headers: Record<string, string> }, file: File) {
//     const res = await fetch(signed.url, {
//       method: "PUT",
//       headers: {
//         ...signed.headers,
//         "Content-Type": file.type || "application/octet-stream",
//       },
//       body: file,
//     });
//     if (!res.ok) throw new Error(`PUT file HTTP ${res.status}`);
//   }
  
//   export async function commitRegistry(opts: {
//     json: unknown;
//     expectedEtag?: string | null;
//     token: string;
//   }) {
//     const res = await fetch(COMMIT_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-admin-token": opts.token,
//       },
//       body: JSON.stringify({ json: opts.json, expectedEtag: opts.expectedEtag }),
//     });
//     const data = await res.json().catch(() => ({}));
//     if (!res.ok || (data && data.error)) {
//       throw new Error(data?.error || `commit-registry HTTP ${res.status}`);
//     }
//     return data as { ok: true; etag?: string; versionId?: string };
//   }
  