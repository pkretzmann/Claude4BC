#!/usr/bin/env bash
# bc-baseapp-source.sh — fetch and diff Business Central Base App source across versions.
#
# Uses StefanMaron/MSDyn365BC.Code.History. Path resolution is done from a blobless
# shallow clone (~1 MB per branch), so there is no GitHub API rate limit involved.
#
# Usage:
#   bc-baseapp-source.sh <object-name> [options]
#
#   <object-name>   File-name fragment, e.g. CloseIncomeStatement, SalesPost,
#                   "Gen. Journal Line" (spaces/dots are stripped before matching).
#
# Options:
#   -b, --branches LIST   Comma-separated branches (default: latest 3 w1 majors).
#                         Examples: w1-26,w1-27,w1-28   dk-27   w1-28
#   -a, --all             Fetch every path that matches instead of erroring on ambiguity.
#   -d, --diff            Print unified diffs between consecutive branches.
#   -l, --list            Only list matching paths, download nothing.
#   -o, --out DIR         Output dir (default: ./.bc-source).
#   -r, --repo NAME       sandbox | onprem  (default: onprem)
#                         sandbox = MSDyn365BC.Sandbox.Code.History (includes hotfixes)
#   -h, --help
#
# Env:
#   CLAUDE4BC_CACHE   cache root (default: $HOME/.cache/claude4bc)

set -euo pipefail

REPO_ONPREM="StefanMaron/MSDyn365BC.Code.History"
REPO_SANDBOX="StefanMaron/MSDyn365BC.Sandbox.Code.History"

REPO="$REPO_ONPREM"
BRANCHES=""
OUT="./.bc-source"
DO_DIFF=0
DO_LIST=0
TAKE_ALL=0
QUERY=""

CACHE_ROOT="${CLAUDE4BC_CACHE:-$HOME/.cache/claude4bc}"

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branches) BRANCHES="$2"; shift 2 ;;
    -o|--out)      OUT="$2";      shift 2 ;;
    -r|--repo)
      case "$2" in
        sandbox) REPO="$REPO_SANDBOX" ;;
        onprem)  REPO="$REPO_ONPREM" ;;
        *) echo "unknown --repo '$2' (use sandbox|onprem)" >&2; exit 2 ;;
      esac; shift 2 ;;
    -d|--diff)  DO_DIFF=1;  shift ;;
    -l|--list)  DO_LIST=1;  shift ;;
    -a|--all)   TAKE_ALL=1; shift ;;
    -h|--help)  usage 0 ;;
    -*) echo "unknown option $1" >&2; usage 2 ;;
    *)  QUERY="$1"; shift ;;
  esac
done

[[ -n "$QUERY" ]] || usage 2

# "Gen. Journal Line" -> GenJournalLine
NEEDLE="$(printf '%s' "$QUERY" | tr -d ' .\-_')"

# Resolve the output dir against the *caller's* cwd now — path resolution below cd's
# into the cache clone and never comes back, so a relative --out would otherwise land
# inside the cache instead of in the user's project.
case "$OUT" in
  /* | [A-Za-z]:[\\/]*) OUT_ABS="$OUT" ;;
  *)                   OUT_ABS="$PWD/${OUT#./}" ;;
esac

CACHE="$CACHE_ROOT/$(basename "$REPO")"
mkdir -p "$CACHE_ROOT"

log() { printf '\033[2m%s\033[0m\n' "$*" >&2; }

# ---------- resolve default branches: latest 3 w1 majors ----------
if [[ -z "$BRANCHES" ]]; then
  log "resolving latest w1 branches..."
  mapfile -t MAJORS < <(
    git ls-remote --heads "https://github.com/$REPO" 'refs/heads/w1-*' \
      | sed 's#.*refs/heads/w1-##' \
      | grep -E '^[0-9]+$' | sort -n | tail -3
  )
  [[ ${#MAJORS[@]} -gt 0 ]] || { echo "could not resolve w1 branches" >&2; exit 1; }
  BRANCHES="$(printf 'w1-%s,' "${MAJORS[@]}" | sed 's/,$//')"
  log "using branches: $BRANCHES"
fi

IFS=',' read -r -a BR <<< "$BRANCHES"

# ---------- blobless clone for path resolution ----------
if [[ ! -d "$CACHE/.git" ]]; then
  log "creating blobless cache clone in $CACHE (one-off, ~1 MB/branch)..."
  git clone --filter=tree:0 --no-checkout --depth 1 -b "${BR[0]}" \
    "https://github.com/$REPO" "$CACHE" >/dev/null 2>&1
fi

cd "$CACHE"
for b in "${BR[@]}"; do
  git remote set-branches --add origin "$b" 2>/dev/null || true
done
log "fetching branch metadata..."
git fetch --depth 1 --filter=tree:0 origin "${BR[@]}" >/dev/null 2>&1 || {
  echo "fetch failed — check branch names: ${BR[*]}" >&2; exit 1; }

# ---------- match paths on the newest requested branch ----------
REF_BRANCH="${BR[${#BR[@]}-1]}"
mapfile -t MATCHES < <(
  git ls-tree -r --name-only "origin/$REF_BRANCH" \
    | grep -Ei "/${NEEDLE}\.(Report|Page|PageExt|Table|TableExt|Codeunit|Query|XmlPort|Enum|EnumExt|Interface|Profile|ControlAddIn|PermissionSet|Entitlement|Report(Ext)?)\.al$" \
    || true
)

if [[ ${#MATCHES[@]} -eq 0 ]]; then
  log "no exact object match — falling back to substring search"
  mapfile -t MATCHES < <(
    git ls-tree -r --name-only "origin/$REF_BRANCH" | grep -Ei "[^/]*${NEEDLE}[^/]*\.al$" || true
  )
fi

if [[ ${#MATCHES[@]} -eq 0 ]]; then
  echo "No file matching '$QUERY' on origin/$REF_BRANCH." >&2
  exit 1
fi

if [[ $DO_LIST -eq 1 ]]; then
  printf '%s\n' "${MATCHES[@]}"
  exit 0
fi

if [[ ${#MATCHES[@]} -gt 1 && $TAKE_ALL -eq 0 ]]; then
  echo "Ambiguous — ${#MATCHES[@]} matches. Narrow the name or pass --all:" >&2
  printf '  %s\n' "${MATCHES[@]}" >&2
  exit 1
fi

# ---------- download raw files ----------
mkdir -p "$OUT_ABS"

urlencode() { printf '%s' "$1" | sed 's/ /%20/g; s/#/%23/g'; }

declare -a WRITTEN=()
for path in "${MATCHES[@]}"; do
  base="$(basename "$path" .al)"
  for b in "${BR[@]}"; do
    dest="$OUT_ABS/${base}.${b}.al"
    url="https://raw.githubusercontent.com/$REPO/$b/$(urlencode "$path")"
    code="$(curl -fsSL -o "$dest.tmp" -w '%{http_code}' "$url" || true)"
    if [[ "$code" == "200" ]]; then
      tr -d '\r' < "$dest.tmp" > "$dest"; rm -f "$dest.tmp"
      printf '%s  (%s lines)\n' "$dest" "$(wc -l < "$dest" | tr -d ' ')"
      WRITTEN+=("$dest")
    else
      rm -f "$dest.tmp"
      log "  $b: not found (HTTP $code) — object may not exist in that version"
    fi
  done

  if [[ $DO_DIFF -eq 1 ]]; then
    prev=""
    for b in "${BR[@]}"; do
      cur="$OUT_ABS/${base}.${b}.al"
      [[ -f "$cur" ]] || continue
      if [[ -n "$prev" ]]; then
        echo
        echo "=== diff $(basename "$prev") -> $(basename "$cur") ==="
        diff -u "$prev" "$cur" || true
      fi
      prev="$cur"
    done
  fi
done

echo
echo "Source path: $path"
echo "Repo:        $REPO"
