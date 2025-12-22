#!/usr/bin/env python3
"""
Justicia Legal Corpus Collector
Crawler pour télécharger les textes juridiques officiels (OHADA, BCEAO, BRVM, etc.)
"""
import argparse, hashlib, json, os, re, time, urllib.parse
from dataclasses import dataclass
from typing import Iterable, Dict, Set, List, Optional

import requests
from bs4 import BeautifulSoup

PDF_RE = re.compile(r"\.pdf(\?|$)", re.IGNORECASE)

@dataclass
class Seed:
    name: str
    start_urls: List[str]
    allowed_domains: List[str]

def sha256_file(path: str) -> str:
    """Calcule le hash SHA256 d'un fichier"""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def norm_url(base: str, href: str) -> Optional[str]:
    """Normalise une URL relative en URL absolue"""
    if not href:
        return None
    href = href.strip()
    if href.startswith("javascript:") or href.startswith("mailto:"):
        return None
    return urllib.parse.urljoin(base, href)

def domain_of(url: str) -> str:
    """Extrait le domaine d'une URL"""
    return urllib.parse.urlparse(url).netloc.lower()

def is_allowed(url: str, allowed_domains: List[str]) -> bool:
    """Vérifie si l'URL appartient aux domaines autorisés"""
    d = domain_of(url)
    return any(d == a or d.endswith("." + a) for a in allowed_domains)

def safe_filename(url: str) -> str:
    """Génère un nom de fichier sûr à partir d'une URL"""
    p = urllib.parse.urlparse(url)
    name = os.path.basename(p.path) or "download.pdf"
    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name)
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name

def fetch(session: requests.Session, url: str, timeout: int = 30) -> requests.Response:
    """Télécharge une URL avec gestion d'erreurs"""
    r = session.get(url, timeout=timeout, allow_redirects=True)
    r.raise_for_status()
    return r

def extract_links(html: str, base_url: str) -> List[str]:
    """Extrait tous les liens d'une page HTML"""
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.select("a[href]"):
        u = norm_url(base_url, a.get("href"))
        if u:
            links.append(u)
    return links

def looks_like_pdf(url: str, content_type: Optional[str]) -> bool:
    """Détecte si une URL pointe vers un PDF"""
    if PDF_RE.search(url):
        return True
    if content_type and "application/pdf" in content_type.lower():
        return True
    return False

def download_pdf(session: requests.Session, url: str, out_dir: str) -> Optional[Dict]:
    """Télécharge un PDF et retourne ses métadonnées"""
    # HEAD first (optional)
    try:
        head = session.head(url, timeout=20, allow_redirects=True)
        ctype = head.headers.get("Content-Type", "")
    except Exception:
        ctype = ""
    if not looks_like_pdf(url, ctype):
        return None

    os.makedirs(out_dir, exist_ok=True)
    fname = safe_filename(url)
    path = os.path.join(out_dir, fname)

    r = fetch(session, url)
    ctype2 = r.headers.get("Content-Type", "")
    if not looks_like_pdf(url, ctype2):
        return None

    with open(path, "wb") as f:
        f.write(r.content)

    return {
        "url": url,
        "path": path,
        "sha256": sha256_file(path),
        "content_type": ctype2,
        "bytes": os.path.getsize(path),
        "downloaded_at": int(time.time()),
    }

def crawl(seed: Seed, max_pages: int, delay_s: float, out_root: str) -> None:
    """Crawle un seed et télécharge tous les PDFs trouvés"""
    session = requests.Session()
    session.headers.update({"User-Agent": "JusticiaRAGCollector/1.0 (+contact: justicia@porteo.ci)"})

    q: List[str] = list(seed.start_urls)
    seen: Set[str] = set()
    out_dir = os.path.join(out_root, seed.name)
    manifest_path = os.path.join(out_dir, "manifest.jsonl")
    os.makedirs(out_dir, exist_ok=True)

    pages = 0
    with open(manifest_path, "a", encoding="utf-8") as mf:
        while q and pages < max_pages:
            url = q.pop(0)
            if url in seen:
                continue
            seen.add(url)

            if not is_allowed(url, seed.allowed_domains):
                continue

            # Try direct PDF download
            meta = download_pdf(session, url, out_dir=out_dir)
            if meta:
                mf.write(json.dumps({"seed": seed.name, **meta}, ensure_ascii=False) + "\n")
                mf.flush()
                print(f"✅ Downloaded: {url}")
                time.sleep(delay_s)
                continue

            # Otherwise fetch HTML and expand
            try:
                r = fetch(session, url)
            except Exception as e:
                print(f"⚠️ Error fetching {url}: {e}")
                continue

            ctype = r.headers.get("Content-Type", "")
            if "text/html" not in ctype.lower():
                time.sleep(delay_s)
                continue

            links = extract_links(r.text, base_url=url)
            for u in links:
                if u not in seen and is_allowed(u, seed.allowed_domains):
                    q.append(u)

            pages += 1
            time.sleep(delay_s)

def load_seeds(path: str) -> List[Seed]:
    """Charge les seeds depuis un fichier YAML"""
    import yaml
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    seeds = []
    for s in raw["seeds"]:
        seeds.append(Seed(name=s["name"], start_urls=s["start_urls"], allowed_domains=s["allowed_domains"]))
    return seeds

def main():
    ap = argparse.ArgumentParser(description="Justicia Legal Corpus Collector")
    ap.add_argument("--seeds", required=True, help="YAML manifest with start URLs")
    ap.add_argument("--out", default="data/legal_corpus", help="Output folder")
    ap.add_argument("--max-pages", type=int, default=800, help="Max HTML pages per seed (not PDFs)")
    ap.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    args = ap.parse_args()

    print(f"🚀 Justicia Legal Corpus Collector")
    print(f"📁 Output: {args.out}")
    print(f"⏱️  Delay: {args.delay}s")
    print(f"📄 Max pages per seed: {args.max_pages}")
    print()

    seeds = load_seeds(args.seeds)
    for s in seeds:
        print(f"🔍 Crawling: {s.name}")
        crawl(s, max_pages=args.max_pages, delay_s=args.delay, out_root=args.out)
        print(f"✅ Done: {s.name}\n")

if __name__ == "__main__":
    main()
