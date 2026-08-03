/**
 * Output sanitization: strips secrets from anything that leaves the bridge —
 * tool results, diffs, logs, dashboard payloads.
 */

interface SecretPattern {
  name: string;
  regex: RegExp;
}

const SECRET_PATTERNS: SecretPattern[] = [
  { name: "anthropic-key", regex: /sk-ant-[A-Za-z0-9_-]{10,}/g },
  { name: "openai-key", regex: /sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}/g },
  { name: "aws-access-key", regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: "github-token", regex: /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { name: "slack-token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "google-api-key", regex: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { name: "private-key-block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { name: "jwt", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  {
    name: "generic-assignment",
    regex: /\b(api[_-]?key|apikey|secret|token|password|passwd|auth[_-]?token)\b(\s*[:=]\s*)(["']?)[^\s"']{8,}\3/gi,
  },
];

/** File paths whose contents must never appear in diffs or tool output. */
const SENSITIVE_FILE_PATTERNS: RegExp[] = [
  /(^|[\\/])\.env(\..+)?$/i,
  /(^|[\\/])id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /(^|[\\/])credentials(\.json)?$/i,
  /(^|[\\/])secrets?\.(json|ya?ml|toml)$/i,
  /(^|[\\/])\.npmrc$/i,
  /(^|[\\/])\.netrc$/i,
];

export class Sanitizer {
  /** Replace anything that looks like a secret with a redaction marker. */
  redact(text: string): string {
    let out = text;
    for (const { name, regex } of SECRET_PATTERNS) {
      out = out.replace(regex, (match, ...groups) => {
        // generic-assignment keeps the key name so the output stays readable
        if (name === "generic-assignment") {
          const key = groups[0] as string;
          const sep = groups[1] as string;
          return `${key}${sep}[REDACTED:${name}]`;
        }
        return `[REDACTED:${name}]`;
      });
    }
    return out;
  }

  isSensitivePath(filePath: string): boolean {
    return SENSITIVE_FILE_PATTERNS.some((re) => re.test(filePath));
  }

  /**
   * Remove diff hunks that touch sensitive files (.env, keys, credentials),
   * then redact inline secrets from what remains.
   */
  sanitizeDiff(diff: string): string {
    if (!diff.trim()) return diff;
    const sections = diff.split(/^(?=diff --git )/m);
    const kept = sections.map((section) => {
      const header = section.match(/^diff --git a\/(.+?) b\/(.+)$/m);
      if (header) {
        const [, aPath, bPath] = header;
        if (this.isSensitivePath(aPath ?? "") || this.isSensitivePath(bPath ?? "")) {
          return `diff --git a/${aPath} b/${bPath}\n[diff withheld: sensitive file]\n`;
        }
      }
      return section;
    });
    return this.redact(kept.join(""));
  }

  /** Filter a changed-file list, flagging (not hiding) sensitive paths. */
  annotateFiles(files: string[]): { file: string; sensitive: boolean }[] {
    return files.map((file) => ({ file, sensitive: this.isSensitivePath(file) }));
  }
}
